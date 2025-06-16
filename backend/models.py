from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class ItemStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    ARCHIVED = "archived"
    DRAFT = "draft"

class ExpenseCategory(str, Enum):
    SHIPPING = "shipping"
    PACKAGING = "packaging"
    CLEANING = "cleaning"
    REPAIRS = "repairs"
    MARKETING = "marketing"
    OTHER = "other"

class NotificationType(str, Enum):
    PROFIT_ALERT = "profit_alert"
    MILESTONE = "milestone"
    RESTOCK = "restock"
    LISTING_RENEWAL = "listing_renewal"
    MARKET_TREND = "market_trend"

class VintedItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str
    brand: str
    size: Optional[str] = None
    color: Optional[str] = None
    condition: str
    
    # Pricing Information
    purchase_price: float = 0.0
    listed_price: float
    sold_price: Optional[float] = None
    shipping_cost: float = 0.0
    vinted_fee: float = 0.0
    buyer_protection_fee: float = 0.0
    
    # Performance Metrics
    views: int = 0
    likes: int = 0
    watchers: int = 0
    messages: int = 0
    
    # Photos
    photos: List[str] = []  # Base64 encoded images
    main_photo: Optional[str] = None  # Base64 encoded main image
    
    # Dates
    created_at: datetime = Field(default_factory=datetime.utcnow)
    listed_at: Optional[datetime] = None
    sold_at: Optional[datetime] = None
    last_renewed_at: Optional[datetime] = None
    
    # Status and Tags
    status: ItemStatus = ItemStatus.DRAFT
    tags: List[str] = []
    
    # Analytics
    profit_margin: Optional[float] = None
    roi_percentage: Optional[float] = None
    days_to_sell: Optional[int] = None
    
    # Notifications
    renewal_reminder_sent: bool = False
    low_roi_alert_sent: bool = False

class ItemExpense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    category: ExpenseCategory
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class SalesAnalytics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    month: int
    year: int
    total_sales: float = 0.0
    total_profit: float = 0.0
    total_items_sold: int = 0
    average_selling_time: float = 0.0
    best_performing_category: Optional[str] = None
    best_performing_brand: Optional[str] = None
    roi_percentage: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MarketTrend(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand: str
    category: str
    trend_percentage: float  # +25% = 25.0, -15% = -15.0
    current_avg_price: float
    suggested_price_range: Dict[str, float]  # {"min": 20.0, "max": 35.0}
    confidence_score: float  # 0.0 to 1.0
    date: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None  # Additional context data
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ROITarget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_percentage: float
    current_percentage: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BulkUpload(BaseModel):
    items: List[VintedItem]
    
class ItemFilter(BaseModel):
    status: Optional[ItemStatus] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_profit: Optional[float] = None
    max_profit: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
# Create/Update Models
class VintedItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    brand: str
    size: Optional[str] = None
    color: Optional[str] = None
    condition: str
    purchase_price: float = 0.0
    listed_price: float
    photos: List[str] = []
    main_photo: Optional[str] = None
    tags: List[str] = []

class VintedItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    condition: Optional[str] = None
    purchase_price: Optional[float] = None
    listed_price: Optional[float] = None
    sold_price: Optional[float] = None
    shipping_cost: Optional[float] = None
    vinted_fee: Optional[float] = None
    buyer_protection_fee: Optional[float] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    watchers: Optional[int] = None
    messages: Optional[int] = None
    photos: Optional[List[str]] = None
    main_photo: Optional[str] = None
    status: Optional[ItemStatus] = None
    tags: Optional[List[str]] = None
    sold_at: Optional[datetime] = None
    last_renewed_at: Optional[datetime] = None

class DashboardStats(BaseModel):
    total_items: int = 0
    active_listings: int = 0
    sold_items: int = 0
    total_revenue: float = 0.0
    total_profit: float = 0.0
    average_roi: float = 0.0
    items_needing_renewal: int = 0
    low_performing_items: int = 0
    monthly_profit: float = 0.0
    monthly_sales_count: int = 0
