import {
  UPSAddress,
  UPSLabelPackage,
  UPSPackage
} from '../../../types/carriers/ups';
import { IShipping } from '../../../types/record.types';
import { IAddress } from '../../../types/shipping.types';
import { Country, UPS_WEIGHT_UNITS } from '../../constants';
import { roundToTwoDecimal } from '../../utils/helpers';

export const convertToUPSAddress = (address: IAddress): UPSAddress => {
  const result: UPSAddress = {
    AddressLine: `${address.street1}${
      address.street2 ? ' ' + address.street2 : ''
    }`,
    City: address.city,
    PostalCode: address.zip || '',
    CountryCode: address.country
  };

  if (address.country === Country.USA) {
    result.StateProvinceCode = address.state || '';
  }

  return result;
};

export const buildUpsPackages = (shipment: IShipping): UPSPackage[] => {
  const upsPackages: UPSPackage[] = [];
  const packageInfo = shipment.packageInfo;
  const morePackages = shipment.morePackages;

  if (packageInfo) {
    upsPackages.push({
      PackagingType: {
        Code: '02',
        Description: 'Package'
      },
      Dimensions: {
        UnitOfMeasurement: {
          Code: packageInfo.dimentions!.unitOfMeasure.toUpperCase()
        },
        Length: roundToTwoDecimal(packageInfo.dimentions!.length).toString(),
        Width: roundToTwoDecimal(packageInfo.dimentions!.width).toString(),
        Height: roundToTwoDecimal(packageInfo.dimentions!.height).toString()
      },
      PackageWeight: {
        UnitOfMeasurement: {
          Code: UPS_WEIGHT_UNITS[packageInfo.weight.unitOfMeasure]
        },
        Weight: roundToTwoDecimal(packageInfo.weight.value).toString()
      }
    });
  }

  if (morePackages && morePackages.length > 0) {
    for (let i = 0; i < morePackages.length; i += 1) {
      const packageData = morePackages[i];
      upsPackages.push({
        PackagingType: {
          Code: '02',
          Description: 'Package'
        },
        Dimensions: {
          UnitOfMeasurement: {
            Code: packageData.dimentions!.unitOfMeasure.toUpperCase()
          },
          Length: roundToTwoDecimal(packageData.dimentions!.length).toString(),
          Width: roundToTwoDecimal(packageData.dimentions!.width).toString(),
          Height: roundToTwoDecimal(packageData.dimentions!.height).toString()
        },
        PackageWeight: {
          UnitOfMeasurement: {
            Code: UPS_WEIGHT_UNITS[packageData.weight.unitOfMeasure]
          },
          Weight: roundToTwoDecimal(packageData.weight.value).toString()
        }
      });
    }
  }

  return upsPackages;
};

export const buildUPSLabelPackages = (
  shipment: IShipping
): UPSLabelPackage[] => {
  const packages: UPSLabelPackage[] = [];
  const packageInfo = shipment.packageInfo;
  const morePackages = shipment.morePackages;
  if (packageInfo) {
    packages.push({
      Description:
        shipment.customItems && shipment.customItems.length > 0
          ? shipment.customItems[0].itemTitle
          : '',
      Packaging: {
        Code: '02',
        Description: 'Customer Supplied Package'
      },
      Dimensions: {
        UnitOfMeasurement: {
          Code: packageInfo.dimentions!.unitOfMeasure.toUpperCase()
        },
        Length: roundToTwoDecimal(packageInfo.dimentions!.length).toString(),
        Width: roundToTwoDecimal(packageInfo.dimentions!.width).toString(),
        Height: roundToTwoDecimal(packageInfo.dimentions!.height).toString()
      },
      PackageWeight: {
        UnitOfMeasurement: {
          Code: UPS_WEIGHT_UNITS[packageInfo.weight.unitOfMeasure]
        },
        Weight: roundToTwoDecimal(packageInfo.weight.value).toString()
      }
    });
  }
  if (morePackages && morePackages.length > 0) {
    for (let i = 0; i < morePackages.length; i += 1) {
      const packageData = morePackages[i];
      packages.push({
        Description:
          shipment.customItems && shipment.customItems.length > 0
            ? shipment.customItems[0].itemTitle
            : '',
        Packaging: {
          Code: '02',
          Description: 'Customer Supplied Package'
        },
        Dimensions: {
          UnitOfMeasurement: {
            Code: packageData.dimentions!.unitOfMeasure.toUpperCase()
          },
          Length: roundToTwoDecimal(packageData.dimentions!.length).toString(),
          Width: roundToTwoDecimal(packageData.dimentions!.width).toString(),
          Height: roundToTwoDecimal(packageData.dimentions!.height).toString()
        },
        PackageWeight: {
          UnitOfMeasurement: {
            Code: UPS_WEIGHT_UNITS[packageData.weight.unitOfMeasure]
          },
          Weight: roundToTwoDecimal(packageData.weight.value).toString()
        }
      });
    }
  }
  return packages;
};
