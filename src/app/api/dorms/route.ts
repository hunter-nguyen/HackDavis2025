import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { UCDDormData } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "ucd_combined_dorm_data.json");
    const contents = await fs.promises.readFile(filePath, "utf8");
    const dorms: UCDDormData = JSON.parse(contents);
    return NextResponse.json(dorms);
  } catch (err) {
    console.error("Failed to read dorm data file:", err);
    return NextResponse.error();
  }
}
