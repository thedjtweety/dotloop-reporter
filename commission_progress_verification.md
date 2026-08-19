# Commission Progress Drilldown Verification

- The commission progress drilldown now fills the viewport, keeps the cap and split summary visible, and reserves the remaining height for the transaction list.
- The transaction list exposes a single internal scroll region only when its contents exceed the available viewport; the former narrow, nested dialog scroll is removed.
- Each transaction row is keyboard accessible and opens the complete transaction detail page in broker views.
- Browser verification confirmed a demo transaction opened successfully at `/transaction/48d3833a-409f-49fb-92b8-32e7f984dcfb` with its property, dates, financials, people, compliance, and additional fields visible.
- For token-scoped agent portals, rows keep the user inside the scoped drilldown and show only the shared transaction's details.
