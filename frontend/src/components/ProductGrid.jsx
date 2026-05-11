import ProductItem from "./ProductItem";

const ProductGrid = ({ products, emptyMessage = "No products found" }) => {
  if (!products.length) {
    return (
      <p className="col-span-full text-center text-gray-500 text-lg py-10">
        {emptyMessage}
      </p>
    );
  }

  return products.map((item) => (
    <ProductItem
      key={item._id}
      id={item._id}
      image={item.image}
      name={item.name}
      price={item.price}
    />
  ));
};

export default ProductGrid;
