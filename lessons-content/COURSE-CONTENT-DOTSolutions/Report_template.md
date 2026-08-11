**Penetration Testing Assessment Report**

**Candidate Name:** Nguyễn Đức Cảnh (canhnguyen26)  
**Target:** Trilocor Robotics Ltd.  
**Date:** 04 April 2026  
**Version:** 1.0  

**<span style="color: #ff5555; letter-spacing: 2px;text-align: center;">CONFIDENTIAL</span>**

<div style="page-break-after: always;"></div>

# Table of Contents

[TOC]

<div style="page-break-after: always;"></div>

# 1. Statement of Confidentiality

The contents of this document have been developed by D.O.T Solutions Group. We consider the contents of this document to be proprietary and business confidential information. This information is to be used only in the performance of its intended use. This document may not be released to another vendor, business partner or contractor without prior written consent. Additionally, no portion of this document may be communicated, reproduced, copied or distributed without prior consent.

The contents of this document do not constitute legal advice. The assessment detailed herein is against a designated company for training and examination purposes, and the vulnerabilities in no way affect external or internal infrastructure beyond the agreed scope.

<div style="page-break-after: always;"></div>

# 2. Engagement Contacts

### Costumer Contacts

| Contact   | Title      | Contact Email |
|:--------- |:---------- |:------------- |
| TODO Name | TODO Title | TODO Email    |
| TODO Name | TODO Title | TODO Email    |

### Assessor Contact

| Assessor Name                  | Title          | Assessor Contact Email |
|:------------------------------ |:-------------- |:---------------------- |
| Nguyễn Đức Cảnh (canhnguyen26) | Lead Pentester | 0206canh@gmail.com     |

<div style="page-break-after: always;"></div>

# 3. Executive Summary

Trilocor Robotics Ltd. (“Trilocor” herein) contracted Nguyễn Đức Cảnh to perform a Network Penetration Test of Trilocor’s externally facing network to identify security weaknesses, determine the impact to Trilocor, document all findings in a clear and repeatable manner, and provide remediation recommendations.

## 3.1 Approach

Nguyễn Đức Cảnh performed testing under a “Black Box” approach from May 12, 2023, to May 31, 2026 without credentials or any advance knowledge of Trilocor’s externally facing environment with the goal of identifying unknown weaknesses. Testing was performed from a non-evasive standpoint with the goal of uncovering as many misconfigurations and vulnerabilities as possible. Each weakness identified was documented and manually investigated to determine exploitation possibilities and escalation potential.

## 3.2 Scope

The scope of this assessment was one external IP address, two internal network ranges, the Active Directory domain, and any other Active Directory domains owned by Trilocor discovered if internal network access were achieved.

**In Scope Assets:**

| Host/URL/IP Address | Description                 |
|:------------------- |:--------------------------- |
| 10.129.X.X          | External web server         |
| 172.16.139.0/24     | Trilocor internal network   |
| 172.16.210.0/24     | Trilocor internal network   |
| TRILOCOR.LOCAL      | Trilocor internal AD domain |

## 3.3 Assessment Overview and Recommendations

During the penetration test against Trilocor, Nguyễn Đức Cảnh identified 4 findings that threaten the confidentiality, integrity, and availability of Trilocor's information systems. The findings were categorized by severity level, with 1 of the findings being assigned a critical-risk rating, 0 high-risk rating, 1 medium-risk, and 1 low risk. There was also 1 informational finding related to enhancing security monitoring capabilities.

Trilocor should create a remediation plan based on the Remediation Summary section of this report, addressing all high findings as soon as possible according to the needs of the business.

<div style="page-break-after: always;"></div>

# 4. Network Penetration Test Assessment Summary

Nguyễn Đức Cảnh began all testing activities from the perspective of an unauthenticated user on the internet. Trilocor provided the tester with network ranges but did not provide additional information such as operating system or configuration information.

## 4.1 Summary of Findings

During the course of testing, Nguyễn Đức Cảnh uncovered a total of 4 findings that pose a material risk to Trilocor's information systems. Nguyễn Đức Cảnh also identified 1 informational finding that, if addressed, could further strengthen Trilocor’s overall security posture.

In the course of this penetration test 1 Critical, 1 Medium, 1 Low and 1 Info vulnerabilities were identified:

| #   | Severity Level                                                                                                                        | Finding Name                             |
|:--- |:------------------------------------------------------------------------------------------------------------------------------------- |:---------------------------------------- |
| 1   | <span style="background-color: #ff5555; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">9.9 (Critical)</span> | LLMNR/NBT-NS Response Spoofing           |
| 2   | <span style="background-color: #e0af68; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">6.4 (Medium)</span>   | Insecure File Shares                     |
| 3   | <span style="background-color: #7aa2f7; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">3.1 (Low)</span>      | Directory Listing Enabled                |
| 4   | <span style="background-color: #9ece6a; color: #1a1b26; padding: 3px 8px; border-radius: 4px; font-weight: bold;">0.0 (Info)</span>   | Enhance Security Monitoring Capabilities |

<div style="page-break-after: always;"></div>

# 5. Internal Network Compromise Walkthrough

During the course of the assessment, Nguyễn Đức Cảnh was able gain a foothold via the external network, move laterally, and compromise the internal network, leading to full administrative control over the TRILOCOR.LOCAL Active Directory domain.

## 5.1 Detailed Walkthrough

Nguyễn Đức Cảnh performed the following to fully compromise the domain:

1. Gained initial access via unrestricted file upload.
2. Escalated privileges to local SYSTEM.
3. Pivoted into the internal network.
4. Captured NetNTLMv2 hashes via Responder.
5. Cracked hashes to obtain Domain Admin credentials.

*(Detailed reproduction steps for this attack chain are omitted in this summary snippet)*

<div style="page-break-after: always;"></div>

# 6. Remediation Summary

As a result of this assessment there are several opportunities for Trilocor to strengthen its internal network security.

## 6.1 Short Term

* Finding Reference 1 - Set strong (24+ character) passwords on all SPN accounts.
* Finding Reference 3 - Enforce a password change for all users because of the domain compromise.

## 6.2 Medium Term

* Finding Reference 1 - Disable LLMNR and NBT-NS wherever possible.
* Review all file share privileges and implement the principle of least privilege.

## 6.3 Long Term

* Perform ongoing internal network vulnerability assessments and domain password audits.
* Perform periodic Active Directory security assessments.
* Enhance network segmentation to isolate critical hosts and limit the effects of an internal compromise.

<div style="page-break-after: always;"></div>

# 7. Technical Findings Details

## 1. LLMNR/NBT-NS Response Spoofing - <span style="color: #ff5555;">Critical</span>

| Attribute       | Details                                                                                                                                                                                            |
|:--------------- |:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CWE**         | CWE-522 - Insufficiently Protected Credentials                                                                                                                                                     |
| **CVSS 3.1**    | 9.9 / CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H                                                                                                                                                 |
| **Affected**    | TRILOCOR.LOCAL                                                                                                                                                                                     |
| **Root Cause**  | By responding to LLMNR/NBT-NS network traffic, adversaries may spoof an authoritative source for name resolution to force communication with an adversary-controlled system.                       |
| **Impact**      | The adversary can collect the hash information sent over the wire through tools that monitor the ports for traffic and crack the hashes offline through Brute Force to obtain plaintext passwords. |
| **Remediation** | Disable LLMNR and NetBIOS in local computer security settings or by group policy if they are not needed. Use host-based security software to block LLMNR/NetBIOS traffic.                          |
| **References**  | https://attack.mitre.org/techniques/T1557/001/                                                                                                                                                     |

### Finding Evidence

* Running the Responder tool to attempt to obtain user account password hashes.
* Successfully cracking a password hash with Hashcat to reveal the clear text password value.

---

## 2. Insecure File Shares - <span style="color: #e0af68;">Medium</span>

| Attribute       | Details                                                                                                                                                                      |
|:--------------- |:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CWE**         | CWE-284 - Improper Access Control                                                                                                                                            |
| **CVSS 3.1**    | 6.4 / CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N                                                                                                                           |
| **Affected**    | TRILOCOR.LOCAL                                                                                                                                                               |
| **Root Cause**  | The tester uncovered multiple file shares where all Domain Users have read/write access.                                                                                     |
| **Impact**      | An attacker who gains a foothold in this domain can use this access to search for files containing sensitive data such as credentials and potentially write malicious files. |
| **Remediation** | Review file share privileges to ensure that users are granted access in accordance with the principal of least privilege.                                                    |

---

## 3. Directory Listing Enabled - <span style="color: #7aa2f7;">Low</span>

| Attribute       | Details                                                                                                                                                                     |
|:--------------- |:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CWE**         | CWE-548 - Exposure of Information Through Directory Listing                                                                                                                 |
| **CVSS 3.1**    | 3.1 / CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N                                                                                                                          |
| **Affected**    | 192.168.195.215 (80/TCP)                                                                                                                                                    |
| **Root Cause**  | The web application exposes a directory listing of some files in the web root and subfolders.                                                                               |
| **Impact**      | If an attacker can gain access to sensitive information such as configuration files, they may be able to use these to gain further access to the application or web server. |
| **Remediation** | Restrict access to files and directories based on the concept of least privilege. Disable directory listing in the web server configuration.                                |

---

## 4. Enhance Security Monitoring Capabilities - <span style="color: #9ece6a;">Info</span>

| Attribute       | Details                                                                                                                                                   |
|:--------------- |:--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CWE**         | CWE-693 - Protection Mechanism Failure                                                                                                                    |
| **Root Cause**  | It appeared that the target did not notice “noisy” activities during the course of testing.                                                               |
| **Remediation** | Consider investing in a more advanced network monitoring solution, configuring logging on all hosts, and processing them for anomalies using a SIEM tool. |

<div style="page-break-after: always;"></div>

# A. Appendix

## A.1 Finding Severities

Each finding has been assigned a severity rating of critical, high, medium, low or info. The rating is based off of an assessment of the priority with which each finding should be viewed.

| Rating   | CVSS Score Range |
|:-------- |:---------------- |
| Critical | 9.0 – 10.0       |
| High     | 7.0 – 8.9        |
| Medium   | 4.0 – 6.9        |
| Low      | 0.1 – 3.9        |
| Info     | 0.0              |

## A.2 Host & Service Discovery

| IP Address | Port | Service | Notes         |
|:---------- |:---- |:------- |:------------- |
| 10.129.X.X | 80   | HTTP    | Apache Server |

## A.3 Subdomain Discovery

| URL                | Description     | Discovery Method       |
|:------------------ |:--------------- |:---------------------- |
| dev.trilocor.local | Dev Environment | ffuf vhost brute-force |

## A.4 Exploited Hosts

| Host       | Scope    | Method      | Notes                  |
|:---------- |:-------- |:----------- |:---------------------- |
| 10.129.X.X | External | File Upload | Obtained initial shell |

## A.5 Compromised Users

| Username      | Type         | Method        | Notes                |
|:------------- |:------------ |:------------- |:-------------------- |
| Administrator | Domain Admin | Hash Cracking | Responder -> Hashcat |

## A.7 Credentials Discovered

| Credential | Host         | Value        | Location       | Method Used              |
|:---------- |:------------ |:------------ |:-------------- |:------------------------ |
| 1          | TRILOCOR-WEB | `[MD5 HASH]` | /var/www/html  | Unrestricted file upload |
| 2          | TRILOCOR-DC  | `[MD5 HASH]` | C:\Users\Admin | Pass-the-Hash            |

---

*End of Report*

This report was rendered by **Nguyễn Đức Cảnh (canhnguyen26)**
