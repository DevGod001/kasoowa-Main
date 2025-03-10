// src/pages/AboutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Truck, ShieldCheck } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center">
            <ShoppingBag className="h-6 w-6 text-green-600" />
            <span className="ml-2 text-lg font-bold text-gray-900">
              Kasoowa FoodHub
            </span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Trusted Source for African Foodstuffs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bringing authentic African ingredients and flavors to your kitchen with convenience and quality.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
            <p className="text-gray-600">
              Kasoowa FoodHub was founded with a clear mission: to make authentic African foodstuffs easily accessible while maintaining their quality and cultural integrity. We understand the importance of having reliable access to the ingredients that make our traditional dishes special.
            </p>
            <p className="text-gray-600">
              Based in Port Harcourt, we've grown to become a trusted name in providing quality African food ingredients, serving customers across Nigeria with both local pickup and nationwide delivery options.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">What We Offer</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Fresh, high-quality African foodstuffs
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Traditional grains and staples
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Premium oils and seasonings
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Authentic soup ingredients
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Traditional swallow foods
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Fresh vegetables and native leaves
              </li>
            </ul>
          </div>
        </div>

        {/* Services */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Pickup Service</h3>
              </div>
              <p className="text-gray-600">
                Available exclusively in Port Harcourt. Schedule your preferred shopping time, 
                secure your slot with a 10% deposit, and enjoy a personalized shopping experience 
                at our location.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Truck className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Nationwide Delivery</h3>
              </div>
              <p className="text-gray-600">
                We deliver across Nigeria. Order your favorite African foodstuffs online, 
                and we'll ensure they reach your doorstep in perfect condition.
              </p>
            </div>
          </div>
        </div>

        {/* Quality Promise */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <div className="flex items-center mb-6">
            <ShieldCheck className="h-8 w-8 text-green-600 mr-4" />
            <h2 className="text-2xl font-bold text-gray-900">Our Quality Promise</h2>
          </div>
          <p className="text-gray-600 mb-6">
            At Kasoowa FoodHub, quality isn't just a promise – it's our foundation. We carefully 
            select each product, working directly with trusted suppliers to ensure you receive 
            only the best African foodstuffs.
          </p>
          <ul className="grid md:grid-cols-3 gap-6">
            <li className="space-y-2">
              <h3 className="font-semibold text-gray-900">Quality Selection</h3>
              <p className="text-sm text-gray-600">
                Each product meets our strict quality standards
              </p>
            </li>
            <li className="space-y-2">
              <h3 className="font-semibold text-gray-900">Authentic Sources</h3>
              <p className="text-sm text-gray-600">
                Direct partnerships with trusted suppliers
              </p>
            </li>
            <li className="space-y-2">
              <h3 className="font-semibold text-gray-900">Fresh Products</h3>
              <p className="text-sm text-gray-600">
                Regular stock updates to ensure freshness
              </p>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Kasoowa FoodHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;