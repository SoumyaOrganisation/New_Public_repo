#********************************************** Fetching VM name from ITSM ****************************************************#
param([parameter(mandatory=$true)][string]$id)
$url = "https://support.netcon.in:8448/api/v3/requests/$id"
$technician_key = @{"authtoken"="5175D743-0C77-4BB1-93D1-8E6066658B1A"}
$response = Invoke-RestMethod -Uri $url -Method get -Headers $technician_Key
$file=$response.request.subject
#Regex pattern to fetch Os
$firstString='://'
$secondString='//'
$pattern = "$firstString(.*?)$secondString"
#Perform the opperation
$VmName = [regex]::Match($file,$pattern).Groups[1].Value
#********************************************** Connecting to Azure ****************************************************#
$username1 = 'netdevopsid@netcon.in'
$pass1 = get-content -Path "C:\Users\adminuser\Git_Lint"
#$password= ConvertTo-SecureString $password1 -AsPlainText -Force
$azure_cred = New-Object System.Management.Automation.PsCredential( $username1, $pass1 )
$connect=Connect-AzAccount -Credential $azure_cred -WarningAction Ignore -Confirm:$false -Tenant "3865b44b-651f-4df8-a0c8-2625494f6198" -Subscription "5cce2d40-3f19-4810-8ead-4ad4c2d974dd"
$connect
$resourcegroup = (Get-AzVM -Name $VmName ).ResourceGroupName
#********************************************** Check if service vault exists ****************************************************#
$vault_exists = Get-AzRecoveryServicesVault -ResourceGroupName "$resourcegroup"
if($null -eq $vault_exists )
{
$vault_name=$resourcegroup+"-decommission"
$service_vault = New-AzRecoveryServicesVault -ResourceGroupName $resourcegroup -Name $vault_name -Location "CentralIndia"
$service_vault
}
else
{
$vault_exists =Get-AzRecoveryServicesVault -ResourceGroupName "$resourcegroup"
$vault_name=$vault_exists.Name
}
#********************************************** Create a new service vault ****************************************************#
$targetVaultID = Get-AzRecoveryServicesVault -ResourceGroupName "$resourcegroup" -Name $vault_name | select-object -ExpandProperty ID -ErrorAction Ignore
#********************************************** Set the vault context to enter the vault ****************************************************#
Get-AzRecoveryServicesVault -Name $vault_name | Set-AzRecoveryServicesVaultContext -WarningAction SilentlyContinue
#********************************************** Set the Redundancy config ****************************************************#
Get-AzRecoveryServicesVault -Name $vault_name | Set-AzRecoveryServicesBackupProperty -BackupStorageRedundancy GeoRedundant -WarningAction SilentlyContinue
#********************************************** Enable policy ****************************************************#
$policy = Get-AzRecoveryServicesBackupProtectionPolicy  -Name "EnhancedPolicy"
#********************************************** enable VM ****************************************************#
$enable=Enable-AzRecoveryServicesBackupProtection -ResourceGroupName "$resourcegroup" -Name $VmName -Policy $policy -WarningAction SilentlyContinue
$enable
#************************************ Specify the container, obtain VM information, and run the backup *****************************#
$backupcontainer = Get-AzRecoveryServicesBackupContainer -ContainerType "AzureVM" -FriendlyName $VmName
$item = Get-AzRecoveryServicesBackupItem -Container $backupcontainer -WorkloadType "AzureVM"
$backup=Backup-AzRecoveryServicesBackupItem -Item $item
$backup
#***************************** Wait period for taking backup *******************************************************#
sleep 3600
#*************************** Fetching Resource groupname of VM ****************************************************#
$rg = Get-AzVM  -Name $VmName
$resourcegroup = $rg.ResourceGroupName
#***************************** Fetching NIC of VM ******************************************************#
$vm = Get-AzVm -ResourceGroupName $resourcegroup -Name $VmName
$nic = Get-AzNetworkInterface | where-object {$_.Id -eq $vm.NetworkProfile.NetworkInterfaces[0].Id}
$nicname = $nic.Name
#*****************************  Deleting Vm ******************************************************#
$removevm=Remove-AzVM -ResourceGroupName $resourcegroup -Name $VmName -Force
$removevm
#Deleting NIC from Resource group
$delnic = Remove-AzNetworkInterface -Name $nicname -ResourceGroupName $resourcegroup -Force
$delnic
#Fetching OS disk name of vm
$diskname = $vm.StorageProfile.OsDisk.Name
#Deleting OS disk
$deldisk = Remove-AzDisk -ResourceGroupName $resourcegroup -DiskName $diskname -Force
$deldisk
# Check if the VM is using managed disks
if ($vm.StorageProfile.OsDisk.ManagedDisk) {
   Write-Output "The VM uses managed disks. No storage account is associated."
} else {
   Write-Output "The VM uses unmanaged disks."
}
# Get the OS Disk configuration
$osDisk = $vm.StorageProfile.OsDisk.ManagedDisk.Id
# If it's an unmanaged disk, get the storage account name
if (-not $osDisk.ManagedDisk) {
   $osDiskDetails = Get-AzDisk | where-object { $_.Id -eq $osDisk.Id }
   $storageAccountId = $osDiskDetails.ManagedBy
   $storageAccountName = (Get-AzStorageAccount | where-object { $_.Id -eq $storageAccountId }).StorageAccountName
   Write-Output "Storage Account Name: $storageAccountName"
} 
else {
   Write-Output "The VM is using managed disks; no storage account is associated."
}
$joblist = Get-AzRecoveryservicesBackupJob -VaultId $targetVaultID
$joblist
$backupcontainer = Get-AzRecoveryServicesBackupContainer -ContainerType "AzureVM" -FriendlyName $VmName -VaultId $targetVaultID
$backupItem = Get-AzRecoveryServicesBackupItem -Container $backupcontainer -WorkloadType AzureVM -VaultId $targetVaultID
Disable-AzRecoveryServicesBackupProtection -Item $backupItem -RemoveRecoveryPoints -VaultId $targetVaultID -Force