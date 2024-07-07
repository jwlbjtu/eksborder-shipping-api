import mongoose, { Schema } from 'mongoose';
import { IShipping, PackageInfo } from '../types/record.types';
import convert from 'convert-units';
import { DistanceUnit, ShipmentStatus, WeightUnit } from '../lib/constants';

const ShippingSchema: Schema<IShipping> = new Schema<IShipping>(
  {
    orderId: { type: String, required: true },
    rOrderId: { type: String },
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
        phone: { type: String },
        taxNumber: { type: String }
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
        phone: { type: String },
        taxNumber: { type: String }
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
    signature: { type: String },
    description: { type: String },
    referenceNumber: { type: String },
    specialRemarks: { type: String },
    fretaxdutyType: { type: String },
    taxdutyType: { type: String },
    packageList: {
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
          },
          count: { type: Number }
        }
      ]
    },
    shipmentOptions: {
      type: { shipmentDate: Date }
    },
    invoice: {
      type: {
        currencyCode: { type: String },
        shipmentTerms: { type: String },
        exportReason: { type: String },
        placeOfIncoterm: { type: String },
        insuranceCharges: { type: Number },
        freightCharges: { type: Number },
        invoiceDetailList: [
          {
            descriptionEn: { type: String },
            descriptionCn: { type: String },
            partNumber: { type: String },
            commodityCode: { type: String },
            originalCountry: { type: String },
            weight: { type: Number },
            currencyValue: { type: Number },
            unitCount: { type: Number },
            material: { type: String },
            materialEn: { type: String },
            attributel: { type: String },
            attributelEn: { type: String },
            brand: { type: String },
            brandEn: { type: String },
            model: { type: String },
            modelEn: { type: String },
            measure: { type: String },
            picUrl: { type: String },
            manufacture: { type: String }
          }
        ]
      }
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
    labelUrlList: [
      {
        labelUrl: { type: String, required: true },
        type: { type: String, required: true }
      }
    ],
    invoiceUrl: { type: String },
    turnChannelId: { type: String },
    turnServiceType: { type: String },
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
  if (this.isModified('packageList')) {
    const packageList = this.packageList;
    if (packageList && packageList.length > 0) {
      const newPackages = packageList.map((ele) => {
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
