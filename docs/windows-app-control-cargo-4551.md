# Windows Application Control and Cargo build scripts: error 4551

Research date: 2026-11-12

## Scope and source policy

This note uses primary Microsoft Learn documentation and official Rust documentation/source pages only. Microsoft Q&A is not used as evidence for documented behavior. Claims are separated into **documented fact** and **inference**. URLs are given inline so each claim can be checked against its owning source.

## Executive findings

1. Cargo build scripts are compiled and executed before a package is built. A `build.rs` can also invoke external commands. Cargo therefore causes several child binaries and generated binaries to execute during a normal build, not only the final application. **Documented fact.** Sources: [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html), [Cargo build script examples](https://doc.rust-lang.org/cargo/reference/build-script-examples.html).
2. Cargo's default generated-artifact directory is `target` at the workspace root. Build-script output is under the build directory, whose default is the target directory; `target/debug/build` contains build-script output in the documented layout. `CARGO_TARGET_DIR`, `build.target-dir`, `--target-dir`, and `CARGO_BUILD_BUILD_DIR` can change these locations. **Documented fact.** Sources: [Cargo build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html), [Cargo configuration](https://doc.rust-lang.org/cargo/reference/config.html), [cargo build](https://doc.rust-lang.org/cargo/commands/cargo-build.html).
3. App Control for Business (the current Microsoft documentation name for WDAC) controls executable code and can also cover scripts, MSI files, batch files, and PowerShell sessions. Windows also has AppLocker as a separate application-control technology. **Documented fact.** Source: [Application Control for Windows](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol).
4. Microsoft documents Code Integrity and AppLocker event logs as the primary diagnostics for application-control blocks. Event 3077 is an enforced App Control block for an executable, DLL, or driver; 3076 is the audit equivalent; 3089 carries correlated signature information. AppLocker script/MSI events are in the AppLocker MSI and Script log, including 8029 for enforced script/MSI checks. **Documented fact.** Sources: [App Control event IDs](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/event-id-explanations), [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).
5. Error `4551` is not present in Microsoft's published Win32 system-error range page for 4000-5999. The page lists 4500 and then the next listed block begins at 5001; it does not define a 4551 symbol or message. Microsoft's Error Lookup Tool documentation says codes should be decoded with the tool, and that its text comes from Windows header files. **Documented fact.** Sources: [System error codes 4000-5999](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--4000-5999-), [Microsoft Error Lookup Tool](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-code-lookup-tool).
6. No primary Microsoft documentation found in this research maps decimal `4551` or Rust's `os error 4551` to a Cargo-specific failure. The association between this text and application-control blocking is therefore an **inference** unless the machine's event record identifies the blocking policy and file. Treat the event record, not the number alone, as authoritative.

## What Cargo can execute during a build

### Build scripts

Cargo compiles a package's `build.rs` and executes it just before building that package. **Documented fact.** [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

Build scripts receive environment variables and run with the package root as their current directory. **Documented fact.** [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

Build scripts may invoke external tools through Rust process APIs. The official examples use `Command::new("gcc")`, and the documentation says build scripts can compile or link native code and use tools outside Rust. **Documented fact.** [Cargo build script examples](https://doc.rust-lang.org/cargo/reference/build-script-examples.html).

Cargo sets `OUT_DIR` to a package-specific folder inside the build directory. Build scripts should put generated output and intermediate artifacts there. Cargo also exposes `RUSTC`, `RUSTDOC`, `CARGO`, and wrapper variables to build scripts. **Documented fact.** [Cargo environment variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html).

### Proc macros and host tools

Cargo's build cache documentation describes `target/debug/build` as the location for build-script output and `target/debug/deps` as an artifact directory. When cross-compiling, build scripts and proc macros are built separately for the host architecture. **Documented fact.** [Cargo build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html).

**Inference for diagnosis:** a policy that blocks a freshly generated executable, DLL, proc-macro, build-script executable, linker, or a native helper can surface to Cargo as a failed child-process spawn or failed build step. Cargo documentation establishes that these processes exist; it does not say that error 4551 is the error Cargo will display for a policy block.

### Windows process launch behavior in Rust

On Windows, Rust's `std::process::Command` resolves an executable path before spawning rather than passing a bare name to `CreateProcessW`. The official Rust documentation lists the search order, including the child's explicit `PATH`, the current executable's directory, the system directory, the Windows directory, and the parent process's `PATH`. **Documented fact.** [Rust `std::process::Command`](https://doc.rust-lang.org/std/process/struct.Command.html).

**Inference for diagnosis:** use the exact blocked path from Code Integrity or AppLocker events. Do not assume that the executable named in a Cargo error is the only binary involved, because Cargo, rustc, a linker, a build script, proc macros, and native helper tools can be separate child processes.

## Error 4551: what is known and unknown

### Documented facts

- Microsoft's published 4000-5999 Win32 error page is the authoritative list for that range in the cited documentation, and it does not define 4551. [System error codes 4000-5999](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--4000-5999-).
- Microsoft says its Error Lookup Tool displays message text associated with a hexadecimal status code or other code, using definitions from Windows header files such as `Winerror.h` and `Setupapi.h`. [Microsoft Error Lookup Tool](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-code-lookup-tool).
- App Control's event 3077 includes a Windows NT status code in its `Status` field, plus the blocked file path, parent process, policy name and ID, signing levels, hashes, and other file identity fields. [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).

### Inference and limits

The text `os error 4551` is likely a decimal error surfaced by a Windows process-launch API or a wrapper around it when application control blocks a child process, because application-control blocks are known to stop executable/script execution and Microsoft Q&A reports the same number in such scenarios. However, Q&A is not primary documentation, and this research found no Microsoft header, Microsoft Learn system-error entry, Rust source entry, or Cargo source entry that defines 4551 as an application-control code. This is an inference, not a documented mapping.

Do not claim that 4551 proves WDAC, AppLocker, or Smart App Control. Confirm the policy in event data: event 3077/3076 for App Control, or AppLocker block events for AppLocker script/MSI or executable rules. Also check whether the event identifies Smart App Control's `VerifiedAndReputableDesktop` policy.

## Safe diagnostic workflow on a local Windows 11 development machine

### 1. Reproduce once, then capture the exact child file

Run the failing Cargo command once, then inspect:

- **Event Viewer > Applications and Services Logs > Microsoft > Windows > CodeIntegrity > Operational** for App Control events.
- **Event Viewer > Applications and Services Logs > Microsoft > Windows > AppLocker > MSI and Script** for script/MSI enforcement events.

Microsoft identifies these as the core App Control event-log locations. **Documented fact.** [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).

For executable, DLL, and driver blocks, inspect event 3077 in enforcement mode or 3076 in audit mode. Correlate event 3089 using the `Correlation ActivityID`; 3089 contains signature information and unsigned files have `TotalSignatureCount` equal to 0. **Documented fact.** [App Control event IDs](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/event-id-explanations).

Record at least `File Name`, `Process Name`, `PolicyName`, `PolicyId`, `Status`, `Requested Signing Level`, `Validated Signing Level`, hashes, `UserWriteable`, and the correlated Activity ID. Microsoft documents these fields for event 3077. **Documented fact.** [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).

For script and MSI blocks, inspect the AppLocker MSI and Script log and correlate 8029 with 8038 where present. Microsoft documents 8029 as the enforced equivalent of 8028 and 8038 as signature information correlated with 8028/8029. **Documented fact.** [App Control event IDs](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/event-id-explanations).

### 2. Inventory active policies

Microsoft's troubleshooting procedure recommends collecting general App Control diagnostics with `cidiag.exe /stop` when available, recording system information with `msinfo32.exe`, and inventorying active policies with `citool.exe -lp -json`. It also recommends exporting effective AppLocker policy with `Get-AppLockerPolicy -xml -Effective`. **Documented fact.** [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).

Suggested elevated PowerShell collection, adapted from Microsoft's documented commands:

```powershell
$dir = "$env:USERPROFILE\AppData\Local\Temp\DiagOutputDir\CiDiag"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
cidiag.exe /stop
msinfo32.exe /report "$dir\SystemInformation.txt"
citool.exe -lp -json > "$dir\CiToolOutput.json"
Get-AppLockerPolicy -xml -Effective > "$dir\AppLocker.xml"
```

If `CiDiag.exe` or `CiTool.exe` is absent on that Windows version, Microsoft says to collect the policy binaries, event logs, AppLocker registry data, AppLocker policy files, and effective policy manually. **Documented fact.** [App Control troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).

### 3. Check Smart App Control separately

Microsoft's Smart App Control developer documentation says to check its state in **Settings > Privacy & Security > Windows Security > App and Browser Control > Smart App Control settings**. It also documents `citool.exe -lp` policy names: `VerifiedAndReputableDesktopEvaluation` for evaluation and `VerifiedAndReputableDesktop` for enforcement when `Is Currently Enforced` is true. **Documented fact.** [Test App Signatures with Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/test-your-app-with-smart-app-control).

Smart App Control enforcement can prevent an app from running when its signature is invalid. Microsoft says Smart App Control allows recognized-safe code or code signed with a certificate issued by a CA in the Microsoft Trusted Root Program; unknown unsigned code is blocked by default. **Documented fact.** Sources: [Smart App Control overview](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview), [Sign your app for Smart App Control compliance](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control).

Microsoft says the Code Integrity log records blocked or audited files, not installation-level failure reasons. Therefore, inspect every 3076/3077 event generated during the build, not only the final Cargo error. **Documented fact.** [Test App Signatures with Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/test-your-app-with-smart-app-control).

## Safe allowlisting options and caveats

### Preferred order for local development

1. **Use audit mode first.** Microsoft recommends `Enabled:Audit Mode` initially so applications continue to run while App Control logs files that would be blocked. Audit events can then be used to refine the policy before enforcement. **Documented fact.** [App Control policy rules and file rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/select-types-of-rules-to-create).
2. **Allow only the exact files or trusted signers identified by events.** Microsoft documents hash, FileName, FilePath, SignedVersion, Publisher, FilePublisher, LeafCertificate, and PcaCertificate rule levels. Hash is most specific but must be updated whenever the file changes; signer-based rules generally survive updates signed by the same signer. **Documented fact.** [App Control policy rules and file rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/select-types-of-rules-to-create).
3. **For frequently rebuilt unsigned artifacts, prefer an isolated development environment or a narrowly scoped, controlled policy rather than a broad user-writable path rule.** The isolation recommendation is a security judgment. Microsoft documents that FilePath rules are based on mutable access permissions and recommends transitioning toward managed installer or signature-based rules; Microsoft also warns about policies that trust user-writable locations. **Documented fact plus inference.** Sources: [App Control policy rules and file rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/select-types-of-rules-to-create), [Working with AppLocker rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/applocker/working-with-applocker-rules).
4. **If policy architecture supports it, use a supplemental policy.** Microsoft documents supplemental policies as a way to expand a base policy when the base policy enables `Enabled:Allow Supplemental Policies`; the base policy and signing requirements still govern safety. **Documented fact.** [App Control policy rules and file rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/select-types-of-rules-to-create).
5. **For distributed binaries, sign all relevant outputs.** Microsoft's Smart App Control signing documentation says trusted code-signing certificates are required for code that must pass the trusted-signature path. For Cargo projects, that means checking the final executable and any DLLs, helper executables, installers, scripts, and generated components that are actually loaded or executed. The list of Cargo components follows from Cargo's documented build-script and external-tool behavior; the need to sign each loaded binary is a security inference that must be verified against the policy and event logs. Sources: [Sign your app for Smart App Control compliance](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control), [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

### AppLocker-specific path, publisher, and hash rules

AppLocker has three primary rule conditions: publisher, path, and file hash. Microsoft recommends publisher rules when possible because they are more resilient to application updates and location changes. **Documented fact.** [Working with AppLocker rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/applocker/working-with-applocker-rules).

Microsoft warns that a path rule covering a folder writable by a standard user can let that user, or malware running with that user's privileges, copy an unapproved file there and run it. Microsoft specifically says to avoid path conditions for standard-user-writable locations such as a user profile. **Documented fact.** [Working with AppLocker rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/applocker/working-with-applocker-rules).

**Practical safe implication:** do not create a blanket AppLocker allow rule for `%USERPROFILE%`, the entire Cargo registry, or an unrestricted `target` tree. If a path rule is unavoidable on a personal development machine, use a dedicated directory with restrictive ACLs, keep it narrowly scoped, and understand that every executable placed there becomes eligible. This is an inference from Microsoft's mutable-path warning, not a Microsoft-prescribed universal developer recipe.

### Smart App Control caveat

Microsoft's Smart App Control developer guidance documents audit-policy testing and trusted code signing. It does not document a per-application "allow this unsigned local build" exception. **Documented fact about the documented guidance, not proof that no implementation-specific exception exists.** Sources: [Test App Signatures with Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/test-your-app-with-smart-app-control), [Smart App Control overview](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview).

Microsoft documents that changing Smart App Control from On or Off is a one-way operation in Windows Settings unless the current setting is Evaluation. It also documents registry/policy procedures for testing. Do not change the host's protection mode merely to hide an unexplained Cargo error; first capture policy and event evidence. **Documented fact plus safety recommendation.** [Test App Signatures with Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/test-your-app-with-smart-app-control).

## Suggested citation structure for future bug reports

Use this structure so observed facts and conclusions do not get mixed:

1. **Observed symptom:** exact Cargo command, full `os error 4551` text, timestamp, and exact executable path if Cargo prints one.
2. **Policy identity:** `citool.exe -lp -json` output, Smart App Control mode, and effective AppLocker policy export.
3. **Event evidence:** CodeIntegrity 3077 or 3076; AppLocker 8029/8038 or relevant EXE/DLL event; include `File Name`, `Process Name`, `PolicyName`, `PolicyId`, `Status`, signing levels, hash, and Activity ID.
4. **Cargo context:** package and dependency, `build.rs` or proc-macro involved, `OUT_DIR`, target directory, linker/compiler/wrapper paths, and whether an external tool was invoked. Cite [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html), [Cargo build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html), and [Cargo environment variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html).
5. **Conclusion labels:**
   - **Documented:** quote the Microsoft or Rust source and link it.
   - **Observed:** quote the local event/log field.
   - **Inference:** state the proposed relationship, such as “the event's blocked `target\\debug\\build\\...` executable is a Cargo build-script child.”
   - **Unknown:** say that no primary source maps error 4551 itself.
6. **Remediation tested:** exact narrow rule or signed artifact, policy mode, reboot/refresh action, and whether the same event disappears. Never report “allowlisted Cargo” without naming the actual file, signer, hash, or path rule.

## Primary sources

- Microsoft, [Application Control for Windows](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol).
- Microsoft, [App Control debugging and troubleshooting](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/appcontrol-debugging-and-troubleshooting).
- Microsoft, [Understanding App Control event IDs](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/operations/event-id-explanations).
- Microsoft, [Use audit events to create App Control policy rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/deployment/audit-appcontrol-policies).
- Microsoft, [Understand App Control policy rules and file rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/select-types-of-rules-to-create).
- Microsoft, [Working with AppLocker rules](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/applocker/working-with-applocker-rules).
- Microsoft, [Test App Signatures with Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/test-your-app-with-smart-app-control).
- Microsoft, [Smart App Control overview](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview).
- Microsoft, [Sign your app for Smart App Control compliance](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control).
- Microsoft, [System Error Codes (4000-5999)](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--4000-5999-).
- Microsoft, [The Microsoft Error Lookup Tool](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-code-lookup-tool).
- Rust, [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).
- Rust, [Cargo build script examples](https://doc.rust-lang.org/cargo/reference/build-script-examples.html).
- Rust, [Cargo build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html).
- Rust, [Cargo environment variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html).
- Rust, [Cargo configuration](https://doc.rust-lang.org/cargo/reference/config.html).
- Rust, [`std::process::Command`](https://doc.rust-lang.org/std/process/struct.Command.html).
