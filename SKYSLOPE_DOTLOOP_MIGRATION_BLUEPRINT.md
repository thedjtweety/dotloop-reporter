# SkySlope-to-Dotloop Records Migration Blueprint

## Recommended Position

The reporting tool should initially offer a **broker-admin-led Migration Center**. It should guide, validate, and document the movement of complete historical transaction packages, but it should **not** log into SkySlope, scrape either platform, or promise an automatic bulk transfer. SkySlope’s published terms prohibit bulk transfers, migrations, downloads, and extractions through its API unless expressly authorized, while Dotloop API access requires registered OAuth access and the correct profile scopes.[1][2]

This makes a Drive- or Dropbox-staged workflow the appropriate first release. It is usable immediately, keeps source-account credentials out of this tool, and produces an audit package a brokerage can retain. A later API-assisted migration can be added only after both vendors approve the scope in writing.

## Recommended Migration Routes

| Route | Broker experience | Strengths | Constraints | Recommendation |
|---|---|---|---|---|
| **Guided Drive/Dropbox migration** | An administrator exports each SkySlope record package, stages it in brokerage-owned cloud storage, creates the matching Dotloop loop, and uploads the source PDFs. | Available without API credentials; human review limits misfiled records; gives the brokerage a durable staging backup. | Requires administrator time; source metadata must be entered or matched separately. | **Launch first.** |
| **Vendor-approved API migration** | An administrator authorizes both vendors, the tool reads approved SkySlope records, creates target loops, uploads documents, and records a migration manifest. | Better scale, repeatability, and metadata fidelity. | Requires written SkySlope authorization for this migration purpose, Dotloop developer access/OAuth, permitted write scopes, and a pilot. | **Evaluate after a pilot.** |
| **Storage-only archive** | SkySlope ZIP packages remain searchable in Drive/Dropbox; the reporting tool indexes the manifest but does not create Dotloop loops. | Fastest and lowest technical risk. | Does not satisfy the stated objective of placing records into Dotloop. | Contingency only. |

## Broker-Admin Migration Runbook

### 1. Establish the scope and source inventory

The administrator exports a transaction inventory from SkySlope or creates a spreadsheet with one row per required transaction. The inventory should include the source file ID or name, address, transaction type, status, agent, closing date, source folder, and whether the package is expected to contain signed documents, compliance checklist documents, communications, or other attachments.

The inventory must cover the brokerage’s required retention population. SkySlope stores transaction records across Manage Transactions, Canceled Contracts, and Access Archives depending on status; an archive-only export may therefore be incomplete for a brokerage’s policy.[3]

### 2. Export complete source packages

For archived SkySlope files, the administrator uses **Access Archives** and selects **All Documents**, not only Checklist Documents. SkySlope documents that this produces a compressed ZIP of the transaction documents, which can then be placed into storage.[4]

The broker should preserve the original ZIP untouched in a `01_Source_Export` folder. A separate working copy may be expanded for review and upload. This keeps a source-of-truth artifact independent of any later destination action.

### 3. Stage in brokerage-owned Google Drive or Dropbox

The walkthrough should require a brokerage-owned folder—not an individual agent’s personal storage account—with a repeatable structure:

```text
SkySlope-to-Dotloop-Migration/
  00_Manifest/
  01_Source_Export/<Transaction-Key>.zip
  02_Working_Files/<Transaction-Key>/
  03_Exceptions/
  04_Reconciliation/
```

Drive and Dropbox are sensible staging locations because SkySlope expressly supports sharing archive ZIPs through them, and Dotloop’s mobile upload workflow supports selecting files from those storage apps.[4][5] This is a file-transfer convenience, not evidence of a native inbound SkySlope-to-Dotloop sync.

### 4. Create the destination record in Dotloop

The administrator creates a dedicated historical-record loop according to the brokerage’s approved Dotloop template and naming convention, for example:

```text
ARCHIVE | 2023-08-14 | 123 Main St | Smith Purchase | SkySlope-000123
```

Use a standard `Historical Migration` template with a top-level `Source Evidence` folder and the brokerage’s approved archive status/process. The exact Dotloop status, template, and required fields must be validated with the brokerage’s Dotloop administrator before the production migration begins.

Dotloop’s documented browser workflow supports adding PDFs to a loop through the Documents area by browsing from a computer; it also supports a unique folder email address for document intake.[6] The user should not treat the email path as the default for large archives unless the broker explicitly approves it, because each message must be reconciled to the correct loop.

### 5. Upload, index, and record the reconciliation result

The administrator uploads the files from `02_Working_Files` into the correct Dotloop folders. The Migration Center records, for each manifest row:

| Check | Required result |
|---|---|
| Source package | Original ZIP exists and opens successfully. |
| Destination loop | Dotloop loop URL/ID and exact destination name are recorded. |
| File reconciliation | Expected file count and uploaded count are recorded; mismatches become exceptions. |
| Search keys | Address, transaction type, agent, closing date, source reference, and destination loop URL are recorded. |
| Integrity | ZIP checksum and optional per-file checksums are retained. |
| Reviewer | Administrator name, completion timestamp, and approval status are recorded. |

An exception is not silently skipped. It should be assigned one of: `missing source file`, `duplicate destination`, `unsupported file`, `metadata mismatch`, `access denied`, or `manual review required`.

### 6. Final compliance review

Before calling a run complete, the broker administrator compares the original inventory against the migration manifest, reviews all exceptions, and exports the final manifest to the brokerage’s records repository. The tool can demonstrate completeness of the documented procedure; it cannot itself determine whether a specific brokerage’s retention policy, state rules, supervision requirements, or legal obligations have been satisfied. The brokerage should have its compliance owner or counsel approve the final policy.

## Migration Center: First-Release Walkthrough

The in-product experience should be a **walkthrough and audit tracker**, not a credential connector. It can be added as a new `SkySlope Transition` section with six steps:

| Step | In-product guidance and controls |
|---|---|
| **1. Prepare** | Select Drive or Dropbox, choose the brokerage retention scope, download a manifest template, and display the required transaction fields. |
| **2. Export from SkySlope** | Link to SkySlope’s official archive-download instructions; prompt for **All Documents**; capture export batch name and source status range. |
| **3. Stage and validate** | Explain the required folder convention; accept a manifest CSV; validate required keys, duplicated source IDs, missing ZIP paths, and missing closing dates. |
| **4. Create Dotloop loops** | Present naming convention, template, and metadata checklist; store destination loop URL/ID after the administrator creates it. |
| **5. Reconcile documents** | Record expected vs. uploaded counts, ZIP hash, reviewer, and exception reason. Show only unresolved rows until cleared. |
| **6. Close the run** | Export a signed-off CSV/PDF-style migration manifest, preserve audit events, and clearly list any remaining exceptions. |

The Drive/Dropbox walkthrough should be neutral: it links the administrator to their own storage, explains the staging convention, and never requests their cloud-storage password in this tool.

## Future API Pilot: Gate Criteria

Do not begin an automated migration until all of the following are complete:

1. SkySlope provides written approval that the broker’s licensed API scope allows this one-time extraction/migration use case. SkySlope’s published license terms otherwise restrict bulk migration/extraction use.[1]
2. Dotloop approves an application, OAuth scopes, profile arrangement, loop creation, and document-upload pattern for the brokerage. Dotloop’s API supports OAuth and loop write operations, but its Loop-It documentation calls out individual-profile limitations.[2]
3. A non-production sample of 25–50 closed files passes reconciliation: source inventory count, expected document count, destination upload count, metadata fields, hashes, and exceptions all match.
4. The brokerage signs off on the retention policy, access model, storage location, and who may approve exceptions.

## Recommended Next Product Step

Build the **Migration Center walkthrough plus manifest validator** first. It serves every broker regardless of API eligibility, produces a defensible audit record, and avoids the contractual risk of automating source extraction before vendor approval. Once a pilot brokerage has written approval from both vendors, add an optional API-assisted destination workflow behind a separate migration project and security review.

## References

[1]: https://skyslope.com/api-license-terms-of-use/ "SkySlope API License Terms of Use"
[2]: https://dotloop.github.io/public-api/ "Dotloop Public API Version 2"
[3]: https://support.skyslope.com/support/solutions/articles/156000366448-property-file-statuses "SkySlope Property File Statuses"
[4]: https://support.skyslope.com/support/solutions/articles/156000366440-download-and-share-archived-files "SkySlope Download and Share Archived Files"
[5]: https://support.dotloop.com/s/article/iOS-Adding-Documents-to-a-Loop "Dotloop iOS Adding Documents to a Loop"
[6]: https://support.dotloop.com/s/article/Adding-Documents-to-a-Loop "Dotloop Adding Documents to a Loop"
