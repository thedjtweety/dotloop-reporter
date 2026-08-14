# SkySlope-to-Dotloop Migration Research Notes

## Official Findings

| Platform | Finding | Migration Implication | Source |
|---|---|---|---|
| SkySlope | An administrator can locate an archived property file, download all documents or checklist documents, and receive a compressed ZIP archive. | A broker-admin-led, one-time source export is viable at the individual-file level. The workflow should require the **All Documents** option for a complete record package. | [SkySlope archive download guide](https://support.skyslope.com/support/solutions/articles/156000366440-download-and-share-archived-files) |
| SkySlope | Its archive-download guide explicitly identifies Google Drive and Dropbox as places to store or share the ZIP package. | Drive or Dropbox can be the neutral staging repository, but this does not itself create Dotloop loops. | [SkySlope archive download guide](https://support.skyslope.com/support/solutions/articles/156000366440-download-and-share-archived-files) |
| SkySlope | Archived transactions reside in Access Archives, while other transaction statuses reside in separate areas. | The broker’s source checklist must cover archived, closed, canceled, pending, and other required status populations rather than relying on one view. | [SkySlope file-status guide](https://support.skyslope.com/support/solutions/articles/156000366448-property-file-statuses) |
| Dotloop | Documents can be added to a loop from templates, local computer upload, or email. | The documented browser workflow supports uploading a record package’s PDFs into an already-created loop, but does not establish a bulk SkySlope-to-Dotloop importer. | [Dotloop document-upload guide](https://support.dotloop.com/s/article/Adding-Documents-to-a-Loop) |
| Dotloop | On iOS, document upload can be sourced from Dropbox, Google Drive, or device storage. | Drive/Dropbox are practical staging sources for a guided, human-admin migration workflow. | [Dotloop mobile-upload guide](https://support.dotloop.com/s/article/iOS-Adding-Documents-to-a-Loop) |
| Dotloop | API Nation’s Google Drive and Dropbox workflows copy documents **out of** Dotloop into storage. The Google workflow expressly says it does not put data back into Dotloop. | These integrations are preservation/backup mechanisms, not an official inbound SkySlope migration route. They should not be represented as automated import. | [Google Drive backup guide](https://support.dotloop.com/s/article/Google-Drive-Backup-via-API-Nation); [Dropbox backup guide](https://support.dotloop.com/s/article/Dropbox-via-API-Nation) |

## Provisional Design Conclusion

The safe baseline is a **guided broker-admin migration runbook**: export each completed SkySlope record as an All Documents ZIP, stage and validate it in a brokerage-owned Drive or Dropbox folder, create the target Dotloop loop, and upload the PDFs from the staging folder into the correct Dotloop folder. Dotloop documentation confirms document upload but does not currently establish a supported bulk inbound migration path from SkySlope. Any automated creation of loops or bulk document upload should therefore be conditional on written vendor approval and API entitlement.

## Research Still Needed

- Confirm SkySlope’s Document File Replication and API service terms through sales/support rather than inferring entitlement from public headings.
- Confirm Dotloop’s current partner/API access terms for loop creation and document upload at brokerage scale.
- Define the audit manifest, checksum process, retention policy, and exception workflow required for a compliance archive migration.

## API Feasibility Update

| Platform | Finding | Decision Impact | Source |
|---|---|---|---|
| SkySlope | SkySlope describes a Transaction Management API for current customers, but its published API license terms prohibit bulk transfers, migrations, downloads, and extractions unless expressly authorized in the license. | Do **not** propose an automated extraction against SkySlope APIs by default. The brokerage needs written confirmation from SkySlope that its specific export/migration is authorized, or it should use the documented administrator archive-download workflow. | [SkySlope API overview](https://skyslope.com/general/unlocking-the-power-of-your-data/); [SkySlope API terms](https://skyslope.com/api-license-terms-of-use/) |
| Dotloop | Dotloop’s published API uses registered OAuth applications and supports loop creation, details, contacts, and document-related operations. | A high-fidelity automated destination workflow is technically plausible only after Dotloop grants developer access and confirms the necessary write scopes and document-upload endpoints for the brokerage’s profile arrangement. | [Dotloop Public API v2](https://dotloop.github.io/public-api/); [Dotloop Developer Center](https://info.dotloop.com/developers) |
| Dotloop | The public API guide warns that Loop-It access is restricted to individual profiles. | Do not promise that a brokerage-wide bulk creator will work through Loop-It. Validate the brokerage’s profile configuration and permitted API scope in a small pilot. | [Dotloop Public API v2](https://dotloop.github.io/public-api/) |

## Recommended Boundary

The reporting tool should first provide a **guided records-transition walkthrough and manifest validator**, not execute vendor login, scraping, or bulk migration. A future automated migration can be evaluated only as a vendor-approved, broker-authorized integration with separate SkySlope and Dotloop access agreements. This protects the brokerage from incomplete records, credentials exposure, and unauthorized extraction.
