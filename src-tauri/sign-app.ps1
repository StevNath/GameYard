$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=GameYard-Dev" `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -CertStoreLocation "Cert:\CurrentUser\My"

$pwd = Read-Host "PFX password" -AsSecureString
Export-PfxCertificate -Cert $cert -FilePath ".\gameyard-dev.pfx" -Password $pwd

foreach ($storeName in @("Root", "TrustedPublisher")) {
  $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($storeName, "CurrentUser")
  $store.Open("ReadWrite")
  $store.Add($cert)
  $store.Close()
}

Write-Host "Cert created and trusted for this Windows user: $($cert.Thumbprint)"
Write-Host "PFX: .\gameyard-dev.pfx"
