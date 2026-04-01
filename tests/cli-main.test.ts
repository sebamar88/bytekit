import { describe, it, expect, vi } from "vitest";
import { runCli } from "../src/cli/index";

describe("CLI main entry", () => {
    it("should show help when no arguments are provided", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        await runCli([]);
        expect(spy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
        spy.mockRestore();
    });

    it("should handle unknown arguments", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        try {
            await runCli(["--invalid"]);
        } catch {
            // ignore exit error
        }

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should error on unsupported --version flag", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        try {
            await runCli(["--version"]);
        } catch {
            // ignore exit error
        }

        expect(spy).toHaveBeenCalledWith(expect.stringContaining("Missing URL"));
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should handle help command", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        await runCli(["--help"]);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("should error on unsupported create command", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(runCli(["create", "test-item"])).rejects.toThrow();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should error on unsupported resource command", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("exit");
        });

        await expect(runCli(["resource", "user"])).rejects.toThrow();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should exit with error when --ddd is given without --domain", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("process.exit");
        });
        try {
            await runCli(["--ddd", "--port=SomeRepo"]);
        } catch {
            // swallow the mocked exit throw
        }
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("--domain")
        );
        errorSpy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should exit with error when --ddd is given without --port", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
            throw new Error("process.exit");
        });
        try {
            await runCli(["--ddd", "--domain=Foo"]);
        } catch {
            // swallow the mocked exit throw
        }
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("--port")
        );
        errorSpy.mockRestore();
        exitSpy.mockRestore();
    });
});
