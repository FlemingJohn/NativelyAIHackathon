/**
 * Facade over whichever web-data source is currently wired up.
 *
 * Bright Data is pending payment verification on the account (see
 * bright-data.md), so this points at freeDataClient for now. Once Bright
 * Data access is unblocked, swap the import below for brightdataClient --
 * routes call this module, not the implementations directly, so that's the
 * only line that needs to change.
 */

import * as impl from "./freeDataClient.js";

export const searchEngine = impl.searchEngine;
export const scrapeAsMarkdown = impl.scrapeAsMarkdown;
