import Hero from "../components/home/Hero";
import Categories from "../components/home/Categories";
import FeaturedProducts from "../components/home/FeaturedProducts";
import DesignWithAI from "../components/home/DesignWithAI";
import Gallery from "../components/home/Gallery";
import HowItWorks from "../components/home/HowItWorks";
import Benefits from "../components/home/Benefits";
import CTA from "../components/home/CTA";

function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <DesignWithAI />
      <Gallery />
      <HowItWorks />
      <Benefits />
      <CTA />
    </>
  );
}

export default Home;