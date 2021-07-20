import {
  FedexAuth,
  FedexCredential,
  Version
} from '../../../types/carriers/fedex';

export const generateAuthentication = (
  credential: FedexCredential,
  version: Version
): FedexAuth => {
  const params: FedexAuth = {
    WebAuthenticationDetail: {
      UserCredential: {
        Key: credential.key,
        Password: credential.password
      }
    },
    ClientDetail: {
      AccountNumber: credential.accountNumber,
      MeterNumber: credential.meterNumber
    },
    Version: {
      ServiceId: version.ServiceId,
      Major: version.Major,
      Intermediate: version.Intermediate,
      Minor: version.Minor
    }
  };

  return params;
};
