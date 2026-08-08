"""Facade over whichever web-data source is currently wired up.

Bright Data is pending payment verification on the account (see
bright-data.md), so this points at free_data_client for now. Once Bright
Data access is unblocked, swap the import below for brightdata_client --
routers call this module, not the implementations directly, so that's the
only line that needs to change.
"""

from app.services import free_data_client as _impl

search_engine = _impl.search_engine
scrape_as_markdown = _impl.scrape_as_markdown
