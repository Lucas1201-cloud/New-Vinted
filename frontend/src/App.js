import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ItemsManagement from "./components/ItemsManagement";
import AddItemForm from "./components/AddItemForm";
import Analytics from "./components/Analytics";
import Notifications from "./components/Notifications";
import BulkOperations from "./components/BulkOperations";
import FinancialReports from "./components/FinancialReports";
import InventoryForecasting from "./components/InventoryForecasting";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/items', label: 'Items', icon: '📦' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/forecasting', label: 'Forecasting', icon: '🔮' },
    { path: '/financial', label: 'Financial', icon: '💰' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Vinted Tracker</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              AI-Powered Sales Intelligence
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  const handleAddItemClick = () => {
    setEditingItem(null);
    setShowAddItemModal(true);
  };

  const handleEditItemClick = (item) => {
    setEditingItem(item);
    setShowAddItemModal(true);
  };

  const handleModalClose = () => {
    setShowAddItemModal(false);
    setEditingItem(null);
  };

  const handleItemAdded = () => {
    setShowAddItemModal(false);
    setEditingItem(null);
    // Refresh the page to reload data
    window.location.reload();
  };

  const handleBulkOperationsClick = () => {
    setShowBulkOperations(true);
  };

  const handleBulkOperationsClose = () => {
    setShowBulkOperations(false);
  };

  const handleBulkOperationsSuccess = () => {
    setShowBulkOperations(false);
    // Refresh the page to reload data
    window.location.reload();
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard onAddItemClick={handleAddItemClick} onBulkOperationsClick={handleBulkOperationsClick} />} />
          <Route 
            path="/items" 
            element={
              <ItemsManagement 
                onAddItemClick={handleAddItemClick}
                onEditItemClick={handleEditItemClick}
                onBulkOperationsClick={handleBulkOperationsClick}
              />
            } 
          />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/forecasting" element={<InventoryForecasting />} />
          <Route path="/financial" element={<FinancialReports />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
        
        <AddItemForm
          isOpen={showAddItemModal}
          onClose={handleModalClose}
          onItemAdded={handleItemAdded}
          editingItem={editingItem}
        />

        <BulkOperations
          isOpen={showBulkOperations}
          onClose={handleBulkOperationsClose}
          onSuccess={handleBulkOperationsSuccess}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
