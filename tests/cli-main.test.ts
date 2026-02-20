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
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
        
        try {
            await runCli(["--invalid"]);
        } catch (e) {
            // ignore exit error
        }
        
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should handle version command", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { return undefined as never; });
        await runCli(["--version"]);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should handle help command", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        await runCli(["--help"]);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("should handle create command", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { return undefined as never; });
        // Simular que falla la URL para que no intente fetch real
        await runCli(["create", "test-item"]);
        expect(exitSpy).toHaveBeenCalled();
        spy.mockRestore();
        exitSpy.mockRestore();
    });

    it("should handle resource command", async () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { return undefined as never; });
        await runCli(["resource", "user"]);
        expect(exitSpy).toHaveBeenCalled();
        spy.mockRestore();
        exitSpy.mockRestore();
    });
});
