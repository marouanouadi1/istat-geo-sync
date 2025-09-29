import { readFile } from "fs/promises";
import path from "path";

export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};
export type AppConfig = {
  database?: DatabaseConfig;
};

export async function loadConfig(configPath: string): Promise<AppConfig> {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  try {
    const raw = await readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    throw error;
  }
}
