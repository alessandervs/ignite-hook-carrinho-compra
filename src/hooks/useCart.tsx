import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {

      return JSON.parse(storagedCart)
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      const updateCart = [...cart]
      const productExists = updateCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {

        productExists.amount = amount;


      } else {

        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1,
        }

        updateCart.push(newProduct)

      }


      setCart(updateCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))

    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart]
      const productExists = updateCart.find(product => product.id === productId)

      const newAmoutCart = productExists ? updateCart.filter((product) => product.id !== productId) : updateCart

      if (productExists) {

        setCart(newAmoutCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newAmoutCart))

      } else {

        toast.error('Erro na remoção do produto');
      }

    } catch {

      toast.error('Erro na remoção do produto');
    }
  };


  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const updateCart = [...cart]
      const productExists = updateCart.find(product => product.id === productId)
      const newUpdateCart = updateCart.filter(product => product.id !== productId)


      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 1;
      const newAmount = currentAmount >= 1 ? amount : 1;


      if (newAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (newAmount === 0) {

        toast.error('Erro na remoção do produto');
        return;

      }


      if (productExists) {

        const newProductAmount = {
          ...productExists,
          amount: newAmount,

        }

        newUpdateCart.push(newProductAmount)

      }

      setCart(newUpdateCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newUpdateCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
