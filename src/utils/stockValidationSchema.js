import * as Yup from "yup";

export const stockValidationSchema = Yup.object().shape({
  product_name: Yup.string()
    .required("Product name is required")
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must be less than 100 characters"),
  
  category: Yup.string()
    .required("Category is required")
    .min(2, "Category must be at least 2 characters"),
  
  brand: Yup.string()
    .required("Brand is required")
    .min(2, "Brand must be at least 2 characters"),
  
  quantity: Yup.number()
    .required("Quantity is required")
    .min(0, "Quantity must be 0 or greater")
    .integer("Quantity must be a whole number"),
  
  unit_price: Yup.number()
    .required("Unit price is required")
    .min(0.01, "Unit price must be greater than 0")
    .test('decimal', 'Unit price must have at most 2 decimal places', (value) => {
      if (value) {
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }
      return true;
    }),
  
  cost_price: Yup.number()
    .nullable()
    .min(0, "Cost price must be 0 or greater")
    .test('decimal', 'Cost price must have at most 2 decimal places', (value) => {
      if (value) {
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }
      return true;
    }),
  
  expiry_date: Yup.date()
    .nullable()
    .min(new Date(), "Expiry date must be in the future"),
  
  supplier_name: Yup.string()
    .required("Supplier name is required")
    .min(2, "Supplier name must be at least 2 characters"),
  
  description: Yup.string()
    .max(500, "Description must be less than 500 characters"),
  
  image_url: Yup.string()
    .url("Must be a valid URL")
    .nullable(),
});
