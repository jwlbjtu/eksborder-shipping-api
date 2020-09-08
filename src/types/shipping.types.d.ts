export interface ILabelRequest {
    
}

export interface IManifestRequest {
    carrier: string,
    carrierAccount: string,
    manifests: [
        {
            trackingIds: [string]
        }
    ]
}