import api from "./api";

export async function procesarCheckout(checkoutRequest) {
  const { data } = await api.post("/checkout", checkoutRequest);
  return data;
}
