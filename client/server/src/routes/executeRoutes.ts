import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const router = express.Router();

const SUPPORTED_LANGUAGES = ["javascript", "python", "java", "cpp", "go", "rust"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FILE_EXTENSIONS: Record<SupportedLanguage, string> = {
  javascript: "js",
  python: "py",
  java: "java",
  cpp: "cpp",
  go: "go",
  rust: "rs"
};

const DOCKER_IMAGES: Record<SupportedLanguage, string> = {
  javascript: "node:18-alpine",
  python: "python:3.10-alpine",
  java: "openjdk:17-alpine",
  cpp: "gcc:10.2",
  go: "golang:alpine",
  rust: "rust:alpine"
};

let isDockerAvailable = false;

// Proactively check if Docker is active on server startup
exec("docker ps", (err) => {
  if (!err) {
    isDockerAvailable = true;
    console.log("🐳 Docker detected: Secure Container Sandboxing enabled!");
  } else {
    console.log("⚠️ Docker daemon is not active. Falling back to local process sandbox.");
  }
});

/**
 * Returns the shell command(s) needed to compile and/or run the file inside its isolated directory.
 * The commands execute relative to the isolated cwd.
 */
const buildCommand = (lang: SupportedLanguage): string => {
  switch (lang) {
    case "javascript":
      return "node script.js";

    case "python":
      return "python script.py";

    case "java":
      return "javac Main.java && java Main";

    case "cpp": {
      const execName = os.platform() === "win32" ? "script.exe" : "./script";
      return `g++ script.cpp -o script && ${execName}`;
    }

    case "go":
      return "go run script.go";

    case "rust": {
      const execName = os.platform() === "win32" ? "script.exe" : "./script";
      return `rustc script.rs -o script && ${execName}`;
    }
  }
};

const MAX_CODE_LENGTH = 50_000; // 50 KB — prevent sending enormous payloads
const TIMEOUT_MS = 10_000;      // 10 s — compiled languages may need more time

router.post("/", async (req, res) => {
  const { language, code } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!code || typeof code !== "string" || !code.trim()) {
    res.status(400).json({ message: "code is required and must be a non-empty string" });
    return;
  }

  if (code.length > MAX_CODE_LENGTH) {
    res.status(400).json({ message: `Code exceeds maximum allowed size of ${MAX_CODE_LENGTH} characters` });
    return;
  }

  if (!language || !SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    res.status(400).json({
      message: `Language "${language}" is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`
    });
    return;
  }

  const lang = language as SupportedLanguage;
  const uniqueId = Math.random().toString(36).substring(7);
  const ext = FILE_EXTENSIONS[lang];

  // Java class name must match the file name — use "Main.java" to match standard public class Main
  const fileName = lang === "java" ? `Main.${ext}` : `script.${ext}`;
  const uniqueTmpDir = path.join(os.tmpdir(), `codelink_exec_${uniqueId}`);

  // ── Create temp directory and write file ──────────────────────────────────
  try {
    fs.mkdirSync(uniqueTmpDir, { recursive: true });
    fs.writeFileSync(path.join(uniqueTmpDir, fileName), code);
  } catch (err) {
    res.status(500).json({ message: "Failed to set up sandbox execution directory: " + (err as Error).message });
    return;
  }

  const command = buildCommand(lang);

  // Define clean path format for Docker mounts
  const absoluteTmpPath = path.resolve(uniqueTmpDir).replace(/\\/g, "/");
  const dockerImage = DOCKER_IMAGES[lang];

  // If Java, mount Main.java. Otherwise mount script.ext.
  const guestFileName = lang === "java" ? "Main.java" : `script.${ext}`;

  // Formulate docker run execution:
  // --rm (remove container on finish)
  // --network none (strictly block internet outbound access)
  // -v mount (bind compile directory)
  // -w working directory inside container
  // -m 128m (limit physical RAM to prevent memory starvation)
  // --cpus 0.5 (limit CPU cycle footprint)
  const dockerCommand = `docker run --rm --network none -v "${absoluteTmpPath}:/sandbox" -w /sandbox -m 128m --cpus 0.5 ${dockerImage} ${command}`;

  const executionCommand = isDockerAvailable ? dockerCommand : command;

  // ── Execute ───────────────────────────────────────────────────────────────
  exec(
    executionCommand,
    { timeout: TIMEOUT_MS, cwd: uniqueTmpDir },
    (error, stdout, stderr) => {
      // Always clean up the sandbox directory recursively
      try {
        if (fs.existsSync(uniqueTmpDir)) {
          fs.rmSync(uniqueTmpDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        console.warn("Failed to clean up sandbox directory:", uniqueTmpDir, cleanupErr);
      }

      if (error) {
        if (error.killed) {
          res.status(200).json({
            run: {
              output: `Error: Execution timed out (exceeded ${TIMEOUT_MS / 1000}s)`,
              sandboxed: isDockerAvailable
            }
          });
          return;
        }

        // If Docker execution failed due to environment issues, try dynamic host fallback
        if (isDockerAvailable && error.message.includes("docker")) {
          console.warn("Docker command failed. Retrying in host local sandbox...");
          // Clean re-run on host
          exec(
            command,
            { timeout: TIMEOUT_MS, cwd: uniqueTmpDir },
            (hostErr, hostStdout, hostStderr) => {
              if (hostErr) {
                res.status(200).json({
                  run: {
                    output: hostStderr || hostErr.message,
                    sandboxed: false,
                    warning: "Fallback to host executed due to Docker failure."
                  }
                });
                return;
              }
              res.status(200).json({
                run: {
                  output: hostStdout || hostStderr || "(no output)",
                  sandboxed: false,
                  warning: "Fallback to host executed due to Docker failure."
                }
              });
            }
          );
          return;
        }

        res.status(200).json({
          run: {
            output: stderr || error.message,
            sandboxed: isDockerAvailable
          }
        });
        return;
      }

      res.status(200).json({
        run: {
          output: stdout || stderr || "(no output)",
          sandboxed: isDockerAvailable
        }
      });
    }
  );
});

export default router;
