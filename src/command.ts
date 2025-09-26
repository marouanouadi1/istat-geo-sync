import { Command, Option, Argument } from "commander";
import { version } from "../package.json";
import { fetchIstatWorkbook } from "./istat";

const program = new Command();

program
  .name("istat-geo-sync")
  .description(
    "Sync/export ISTAT geographic datasets (Regions/Provinces/Municipalities)"
  )
  .version(version);

program
  .command("export")
  .description("Export normalized datasets to files")
  .addArgument(
    new Argument("<entity>", "Entity to export").choices([
      "regions",
      "provinces",
      "municipalities",
      "all",
    ])
  )
  .addOption(
    new Option("-f, --format <format...>", "one or more output formats")
      .choices(["csv", "json"])
      .makeOptionMandatory(true)
  )
  .option("-o, --out <dir>", "output directory", "out")
  .option(
    "--filename <pattern>",
    "output filename pattern; placeholders: {entity},{date},{ext}",
    "{date}-{entity}.{ext}"
  )
  .action(async function (
    entity: "regions" | "provinces" | "municipalities" | "all",
    options
  ) {
    const wb = await fetchIstatWorkbook();
  });

program.parseAsync();
