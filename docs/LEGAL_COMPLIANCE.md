# Legal and Compliance Documentation
## Dotloop OAuth Authentication System

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Author:** Manus AI  
**Audience:** Legal Team, Compliance Officers, Privacy Officers

---

## Executive Summary

The Dotloop Reporting Tool has implemented OAuth 2.0 authentication using Dotloop as the identity provider. This document outlines the legal and compliance implications of this authentication system, including data privacy considerations, regulatory compliance requirements, and recommended policies and disclosures.

---

## Data Collection and Processing

### Personal Information Collected

The application collects and processes the following personal information through the Dotloop OAuth authentication flow. **User profile data** includes email address (used for account identification and communication), full name (first and last name for display purposes), Dotloop user ID (unique identifier for account linking), and account creation date (timestamp from Dotloop profile). **Authentication data** comprises OAuth access tokens (encrypted, used for API authorization), OAuth refresh tokens (encrypted, used for token renewal), session tokens (JWT, stored in HTTP-only cookies), and IP addresses (logged for security monitoring). **Usage data** includes login timestamps, last activity timestamps, and browser/device information (user agent strings).

### Legal Basis for Processing

Under GDPR Article 6, the legal basis for processing this data is **consent** for users voluntarily creating accounts and authorizing OAuth access, **contractual necessity** for providing the reporting service requires authentication, and **legitimate interests** for security monitoring and fraud prevention. Under CCPA, processing is justified by **service provision** as authentication is necessary to deliver the service and **security** for protecting user accounts and preventing unauthorized access.

### Data Minimization Principle

The system adheres to data minimization by collecting only information necessary for authentication and service delivery, not storing Dotloop passwords (delegated to Dotloop's authentication), encrypting sensitive tokens before storage, and automatically deleting expired tokens after 90 days.

---

## User Rights and Obligations

### Right to Access

Users have the right to request access to their personal data stored in the system. The application provides this through a user profile page showing email, name, account creation date, and last login information. Users can also request a complete data export including all stored personal information, authentication logs, and transaction history.

### Right to Deletion

Users can exercise their right to deletion (right to be forgotten) by using the "Disconnect" feature in the application, which removes all OAuth tokens and authentication data while preserving anonymized transaction history for regulatory compliance. Users can also request complete account deletion, which removes all personal information from the database, with the exception of audit logs retained for legal compliance (1 year retention).

### Right to Data Portability

Users can export their data in machine-readable format (JSON) including profile information, transaction history, and commission reports. The export does not include OAuth tokens or session data for security reasons.

### Right to Rectification

Users can update their profile information through Dotloop, which automatically syncs to the reporting tool on next login. For discrepancies, users should contact Dotloop support to update their primary profile.

---

## Privacy Policy Requirements

### Required Disclosures

The application's privacy policy must include comprehensive disclosures about data handling practices. Under **data collection**, the policy must clearly state what personal information is collected (email, name, Dotloop user ID), how it is collected (through Dotloop OAuth authorization), and why it is collected (authentication and service delivery). 

**Data usage** disclosures must explain that personal information is used for account authentication and management, providing reporting services, security monitoring and fraud prevention, and compliance with legal obligations. The policy must clarify that data is **not sold** to third parties, **not shared** except with Dotloop for authentication, and **not used** for marketing without explicit consent.

**Data storage** information must specify that data is stored in encrypted databases, OAuth tokens are encrypted using AES-256-GCM, session cookies are HTTP-only and secure, and data is retained for the duration of account activity plus 90 days for expired tokens.

### Third-Party Services

The privacy policy must disclose the relationship with Dotloop as the OAuth identity provider. Users authenticate directly with Dotloop, and the application receives only profile information authorized by the user. Dotloop's privacy policy governs their data handling practices, and users should review Dotloop's privacy policy separately.

### Cookie Policy

The application uses essential cookies for authentication and session management. The **dotloop_session cookie** is HTTP-only and secure, expires after 7 days, and is required for authentication (cannot be disabled). Users must be informed that disabling cookies will prevent login and service access.

---

## Regulatory Compliance

### GDPR Compliance (European Users)

For users in the European Economic Area, the application implements several GDPR-compliant practices. **Lawful basis** for processing is established through explicit user consent via OAuth authorization and contractual necessity for service delivery. **Data protection** measures include encryption of personal data at rest and in transit, access controls limiting data access to authorized personnel, and audit logging of all data access events.

**User rights** are supported through data access requests honored within 30 days, data deletion requests processed within 30 days (excluding legally required retention), and data portability provided in JSON format. **Data breach notification** procedures ensure users are notified within 72 hours of discovery, supervisory authorities are notified as required, and incident response plans are documented and tested.

### CCPA Compliance (California Users)

For California residents, the application provides specific rights and disclosures. **Right to know** is supported by users being able to request what personal information is collected, how it is used, and whether it is sold or shared (it is not). **Right to delete** allows users to request deletion of personal information, with exceptions for legally required retention. **Right to opt-out** confirms that personal information is not sold, so no opt-out mechanism is required. **Non-discrimination** ensures users exercising their rights are not discriminated against in service quality or pricing.

### SOC 2 Considerations

For enterprise customers requiring SOC 2 compliance, the authentication system implements relevant controls. **Security** controls include encryption of data at rest and in transit, secure session management with HTTP-only cookies, and regular security assessments and penetration testing. **Availability** is ensured through redundant database infrastructure, automatic failover mechanisms, and 99.9% uptime SLA target.

**Confidentiality** is maintained through access controls limiting data access, encryption of sensitive data, and non-disclosure agreements with personnel. **Processing integrity** is verified through input validation and sanitization, audit logging of all data modifications, and regular data integrity checks. **Privacy** compliance includes privacy policy disclosure, user consent mechanisms, and data minimization practices.

---

## Terms of Service Considerations

### Account Creation and Authorization

The Terms of Service must clearly state that users create accounts by authorizing OAuth access with Dotloop, users are responsible for maintaining the security of their Dotloop credentials, and users must not share accounts or allow unauthorized access.

### Service Limitations

The Terms should specify that the service is provided "as is" without warranties, Dotloop authentication is required for access, and service availability depends on Dotloop's OAuth service availability.

### Liability and Indemnification

The Terms must address that the company is not liable for Dotloop service outages, users indemnify the company for misuse of their accounts, and liability is limited to the extent permitted by law.

### Termination

The Terms should clarify that users can terminate accounts at any time via the "Disconnect" feature, the company reserves the right to terminate accounts for Terms violations, and upon termination, personal data is deleted per the privacy policy.

---

## Security Incident Response

### Data Breach Notification

In the event of a security breach affecting personal data, the company must follow a documented incident response plan. **Detection and assessment** involves identifying the breach within 24 hours, assessing the scope and severity, and determining affected users and data types. **Containment** requires immediately securing the breach, revoking compromised tokens, and preventing further unauthorized access.

**Notification** procedures mandate notifying affected users within 72 hours via email, notifying supervisory authorities as required by GDPR, and providing clear information about the breach and remediation steps. **Remediation** includes implementing fixes to prevent recurrence, conducting a post-incident review, and updating security controls as needed.

### User Notification Template

In the event of a breach, users should receive clear communication including a description of what happened, what data was affected, what steps the company is taking, what users should do (e.g., change Dotloop password), and contact information for questions.

---

## Vendor Management

### Dotloop as Identity Provider

The company relies on Dotloop as the OAuth identity provider, creating specific vendor management considerations. **Due diligence** requires reviewing Dotloop's security and privacy practices, ensuring Dotloop's compliance with relevant regulations, and maintaining documentation of Dotloop's certifications. **Contractual obligations** should include data processing agreements if required by GDPR, service level agreements for OAuth service availability, and liability allocation for authentication failures.

**Ongoing monitoring** involves regular review of Dotloop's security posture, monitoring OAuth service availability and performance, and staying informed of Dotloop security incidents.

### Data Processing Agreement

If required by GDPR, a Data Processing Agreement (DPA) with Dotloop should address the nature and purpose of processing (authentication), types of personal data processed (email, name, user ID), duration of processing (ongoing during service relationship), and obligations of each party regarding data protection.

---

## Recommended Policies and Procedures

### Privacy Policy

The company must maintain a comprehensive privacy policy that is easily accessible from the login page and homepage, written in clear, plain language, updated whenever data practices change, and versioned with effective dates.

### Cookie Policy

A separate cookie policy or privacy policy section must explain what cookies are used, why they are necessary, how users can manage cookies, and the consequences of disabling cookies.

### Data Retention Policy

A formal data retention policy should specify retention periods for different data types including active user data (retained while account is active), expired OAuth tokens (deleted after 90 days), audit logs (retained for 1 year), and deleted account data (removed within 30 days except legally required retention).

### Access Control Policy

An internal policy should govern who can access user data, requiring authentication for all database access, role-based access control (RBAC), audit logging of all data access, and regular access reviews.

### Incident Response Plan

A documented incident response plan must cover detection and assessment procedures, containment and remediation steps, notification requirements and timelines, and post-incident review and improvement.

---

## Compliance Checklist

### Pre-Launch Requirements

Before launching the authentication system to the public, ensure the following requirements are met:

**Legal Documentation:**
- [ ] Privacy policy published and accessible
- [ ] Terms of service published and accessible
- [ ] Cookie policy published or included in privacy policy
- [ ] Data processing agreement with Dotloop (if required)

**Technical Controls:**
- [ ] OAuth tokens encrypted at rest
- [ ] Session cookies configured as HTTP-only and secure
- [ ] HTTPS enforced for all connections
- [ ] Audit logging enabled for authentication events

**User Rights:**
- [ ] Data access request process documented
- [ ] Data deletion process implemented and tested
- [ ] Data export functionality implemented
- [ ] User consent mechanism for OAuth authorization

**Compliance:**
- [ ] GDPR compliance reviewed (if serving EU users)
- [ ] CCPA compliance reviewed (if serving California users)
- [ ] SOC 2 controls implemented (if required by customers)
- [ ] Security assessment conducted

### Ongoing Compliance

After launch, maintain ongoing compliance through regular privacy policy reviews (quarterly), security assessments (annually), audit log reviews (monthly), data retention policy enforcement (automated), and user rights request processing (within required timeframes).

---

## Risk Assessment

### Legal Risks

Several legal risks must be managed proactively. **Data breach liability** could result from unauthorized access to personal data, with potential fines under GDPR (up to 4% of annual revenue) or CCPA (up to $7,500 per violation). Mitigation strategies include implementing strong security controls, maintaining cyber insurance, and having an incident response plan.

**Non-compliance penalties** may arise from failure to honor user rights requests or inadequate privacy policy disclosures. Mitigation requires regular compliance audits, staff training on data protection, and legal review of policies and procedures.

**Third-party liability** stems from Dotloop OAuth service failures or Dotloop data breaches affecting users. Mitigation involves maintaining contractual protections with Dotloop, monitoring Dotloop's security posture, and having contingency plans for OAuth outages.

### Mitigation Strategies

To minimize legal risks, the company should conduct regular legal and compliance reviews, maintain comprehensive documentation of data practices, provide ongoing staff training on data protection, implement strong technical security controls, and maintain appropriate insurance coverage.

---

## Conclusion

The Dotloop OAuth authentication system introduces specific legal and compliance obligations that must be carefully managed. By implementing the policies, procedures, and controls outlined in this document, the company can provide a secure authentication service while meeting its legal obligations to users and regulatory authorities.

Regular review and updates of this documentation are essential as laws, regulations, and business practices evolve. The legal and compliance teams should work closely with the development and security teams to ensure ongoing compliance and risk management.

For questions or concerns about legal and compliance matters, contact the legal department or compliance officer.

---

**Document Control:**
- **Version:** 1.0
- **Last Review:** January 15, 2026
- **Next Review:** April 15, 2026
- **Owner:** Legal Department
