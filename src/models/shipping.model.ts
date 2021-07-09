import mongoose, { Schema } from 'mongoose';
import { IShipping, PackageInfo } from '../types/record.types';
import convert from 'convert-units';
import { DistanceUnit, ShipmentStatus, WeightUnit } from '../lib/constants';

const ShippingSchema: Schema<IShipping> = new Schema<IShipping>(
  {
    orderId: { type: String, required: true },
    accountName: { type: String },
    carrierAccount: { type: String, index: true },
    carrier: { type: String },
    provider: { type: String },
    service: {
      type: {
        key: { type: String, required: true },
        id: { type: String },
        name: { type: String, required: true }
      }
    },
    facility: { type: String },
    sender: {
      type: {
        name: { type: String },
        company: { type: String },
        street1: { type: String, required: true },
        street2: { type: String },
        city: { type: String, required: true },
        state: { type: String },
        country: { type: String, required: true },
        zip: { type: String, required: true },
        email: { type: String },
        phone: { type: String }
      }
    },
    toAddress: {
      type: {
        name: { type: String },
        company: { type: String },
        street1: { type: String, required: true },
        street2: { type: String },
        city: { type: String, required: true },
        state: { type: String },
        country: { type: String, required: true },
        zip: { type: String, required: true },
        email: { type: String },
        phone: { type: String }
      }
    },
    return: {
      type: {
        name: { type: String },
        company: { type: String },
        street1: { type: String, required: true },
        street2: { type: String },
        city: { type: String, required: true },
        state: { type: String },
        country: { type: String, required: true },
        zip: { type: String, required: true },
        email: { type: String },
        phone: { type: String }
      }
    },
    packageInfo: {
      type: {
        packageType: { type: String },
        weight: {
          type: { value: { type: Number }, unitOfMeasure: { type: String } }
        },
        dimentions: {
          type: {
            length: { type: Number, required: true },
            width: { type: Number, required: true },
            height: { type: Number, required: true },
            unitOfMeasure: { type: String, require: true }
          },
          required: false
        }
      }
    },
    morePackages: {
      type: [
        {
          packageType: { type: String },
          weight: {
            type: { value: { type: Number }, unitOfMeasure: { type: String } }
          },
          dimentions: {
            type: {
              length: { type: Number, required: true },
              width: { type: Number, required: true },
              height: { type: Number, required: true },
              unitOfMeasure: { type: String, require: true }
            },
            required: false
          }
        }
      ]
    },
    shipmentOptions: {
      type: { shipmentDate: Date }
    },
    customDeclaration: {
      type: {
        typeOfContent: { type: String, required: true },
        typeOfContentOther: { type: String },
        incoterm: { type: String, required: true },
        exporterRef: { type: String },
        importerRef: { type: String },
        invoice: { type: String },
        nonDeliveryHandling: { type: String },
        license: { type: String },
        certificate: { type: String },
        signingPerson: { type: String },
        taxIdType: { type: String },
        eelpfc: { type: String },
        b13a: { type: String },
        notes: { type: String }
      }
    },
    status: { type: String, required: true, default: ShipmentStatus.PENDING },
    trackingId: { type: String, index: true },
    trackingStatus: { type: String },
    shippingId: { type: String },
    rate: { type: { amount: Number, currency: String } },
    labels: [
      {
        carrier: { type: String, required: true },
        service: { type: String, required: true },
        tracking: { type: String, required: true },
        createdOn: { type: Date, required: true },
        data: { type: String, required: true },
        format: { type: String, required: true },
        encodeType: { type: String, required: true },
        isTest: { type: Boolean, required: true, default: false }
      }
    ],
    forms: [
      {
        data: { type: String, requied: true },
        format: { type: String, requied: true },
        encodeType: { type: String, requied: true }
      }
    ],
    manifested: { type: Boolean, default: false },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    billingRef: {
      type: Schema.Types.ObjectId,
      ref: 'Billing'
    }
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

ShippingSchema.methods.toJSON = function () {
  const dataObject = this.toObject();
  dataObject.id = this._id;
  dataObject.items = this.items;
  dataObject.customItems = this.customItems;
  return dataObject;
};

ShippingSchema.pre<IShipping>('save', async function save(next) {
  if (this.isModified('packageInfo')) {
    const packageInfo = this.packageInfo;
    if (packageInfo) {
      const weight = packageInfo.weight;
      const dimentions = packageInfo.dimentions;
      const newInfo: PackageInfo = {
        packageType: packageInfo.packageType,
        weight: {
          value: convert(weight.value)
            .from(weight.unitOfMeasure)
            .to(WeightUnit.LB),
          unitOfMeasure: WeightUnit.LB
        }
      };
      if (dimentions) {
        newInfo.dimentions = {
          length: convert(dimentions.length)
            .from(dimentions.unitOfMeasure)
            .to(DistanceUnit.IN),
          width: convert(dimentions.width)
            .from(dimentions.unitOfMeasure)
            .to(DistanceUnit.IN),
          height: convert(dimentions.height)
            .from(dimentions.unitOfMeasure)
            .to(DistanceUnit.IN),
          unitOfMeasure: DistanceUnit.IN
        };
      }
      this.packageInfo = newInfo;
    }
  }

  if (this.isModified('morePackages')) {
    const morePackages = this.morePackages;
    if (morePackages && morePackages.length > 0) {
      const newPackages = morePackages.map((ele) => {
        const eleWeight = ele.weight;
        const eleDimentions = ele.dimentions;
        const newEleInfo: PackageInfo = {
          packageType: ele.packageType,
          weight: {
            value: convert(eleWeight.value)
              .from(eleWeight.unitOfMeasure)
              .to(WeightUnit.LB),
            unitOfMeasure: WeightUnit.LB
          }
        };
        if (eleDimentions) {
          newEleInfo.dimentions = {
            length: convert(eleDimentions.length)
              .from(eleDimentions.unitOfMeasure)
              .to(DistanceUnit.IN),
            width: convert(eleDimentions.width)
              .from(eleDimentions.unitOfMeasure)
              .to(DistanceUnit.IN),
            height: convert(eleDimentions.height)
              .from(eleDimentions.unitOfMeasure)
              .to(DistanceUnit.IN),
            unitOfMeasure: DistanceUnit.IN
          };
        }
        return newEleInfo;
      });
      this.morePackages = newPackages;
    }
  }

  next();
});

ShippingSchema.virtual('items', {
  ref: 'Item', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'shipmentRef', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: false
});

ShippingSchema.virtual('customItems', {
  ref: 'CustomItem', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'shipmentRef', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: false
});

export default mongoose.model<IShipping>('Shipping', ShippingSchema);
