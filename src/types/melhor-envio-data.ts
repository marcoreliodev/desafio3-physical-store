export type ShippingChoice = {
  id: number;
  name: string;
  price: string;
  currency: string;
  company: { name: string };
  delivery_time: number;
};
