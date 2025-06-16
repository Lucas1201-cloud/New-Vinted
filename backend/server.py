from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io
import json
from .models import (
    VintedItem, VintedItemCreate, VintedItemUpdate, ItemExpense, SalesAnalytics,
    MarketTrend, Notification, ROITarget, BulkUpload, ItemFilter, DashboardStats,
    ItemStatus, ExpenseCategory, NotificationType
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Vinted Tracker API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Utility Functions
async def calculate_item_metrics(item: VintedItem) -> VintedItem:
    """Calculate profit margin, ROI, and other metrics for an item"""
    if item.sold_price is not None:
        total_costs = item.purchase_price + item.shipping_cost + item.vinted_fee + item.buyer_protection_fee
        profit = item.sold_price - total_costs
        item.profit_margin = profit
        
        if item.purchase_price > 0:
            item.roi_percentage = (profit / item.purchase_price) * 100
        
        if item.listed_at and item.sold_at:
            item.days_to_sell = (item.sold_at - item.listed_at).days
    
    return item

async def create_notification(notification_type: NotificationType, title: str, message: str, data: dict = None):
    """Create a new notification"""
    notification = Notification(
        type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )
    await db.notifications.insert_one(notification.dict())
    return notification

# Dashboard & Analytics Routes
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Get current month for monthly stats
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Total items
        total_items = await db.vinted_items.count_documents({})
        active_listings = await db.vinted_items.count_documents({"status": ItemStatus.ACTIVE})
        sold_items = await db.vinted_items.count_documents({"status": ItemStatus.SOLD})
        
        # Revenue and profit calculations
        sold_items_cursor = db.vinted_items.find({"status": ItemStatus.SOLD, "sold_price": {"$exists": True}})
        total_revenue = 0.0
        total_profit = 0.0
        monthly_profit = 0.0
        monthly_sales_count = 0
        roi_values = []
        
        async for item in sold_items_cursor:
            revenue = item.get("sold_price", 0)
            costs = (item.get("purchase_price", 0) + item.get("shipping_cost", 0) + 
                    item.get("vinted_fee", 0) + item.get("buyer_protection_fee", 0))
            profit = revenue - costs
            
            total_revenue += revenue
            total_profit += profit
            
            # Monthly stats
            if item.get("sold_at") and item["sold_at"] >= month_start:
                monthly_profit += profit
                monthly_sales_count += 1
            
            # ROI calculation
            if item.get("purchase_price", 0) > 0:
                roi = (profit / item["purchase_price"]) * 100
                roi_values.append(roi)
        
        average_roi = sum(roi_values) / len(roi_values) if roi_values else 0.0
        
        # Items needing renewal (active for more than 30 days)
        thirty_days_ago = now - timedelta(days=30)
        items_needing_renewal = await db.vinted_items.count_documents({
            "status": ItemStatus.ACTIVE,
            "$or": [
                {"last_renewed_at": {"$lt": thirty_days_ago}},
                {"last_renewed_at": {"$exists": False}, "listed_at": {"$lt": thirty_days_ago}}
            ]
        })
        
        # Low performing items (active for more than 60 days with low engagement)
        sixty_days_ago = now - timedelta(days=60)
        low_performing_items = await db.vinted_items.count_documents({
            "status": ItemStatus.ACTIVE,
            "listed_at": {"$lt": sixty_days_ago},
            "views": {"$lt": 10}
        })
        
        return DashboardStats(
            total_items=total_items,
            active_listings=active_listings,
            sold_items=sold_items,
            total_revenue=total_revenue,
            total_profit=total_profit,
            average_roi=average_roi,
            items_needing_renewal=items_needing_renewal,
            low_performing_items=low_performing_items,
            monthly_profit=monthly_profit,
            monthly_sales_count=monthly_sales_count
        )
    except Exception as e:
        logging.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard statistics")

# Item Management Routes
@api_router.post("/items", response_model=VintedItem)
async def create_item(item: VintedItemCreate):
    """Create a new Vinted item"""
    try:
        new_item = VintedItem(**item.dict())
        new_item.listed_at = datetime.utcnow() if new_item.status == ItemStatus.ACTIVE else None
        
        result = await db.vinted_items.insert_one(new_item.dict())
        return new_item
    except Exception as e:
        logging.error(f"Error creating item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create item")

@api_router.get("/items", response_model=List[VintedItem])
async def get_items(
    status: Optional[ItemStatus] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get items with optional filtering"""
    try:
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        if brand:
            query["brand"] = {"$regex": brand, "$options": "i"}
        
        items_cursor = db.vinted_items.find(query).skip(skip).limit(limit)
        items = []
        async for item in items_cursor:
            item_obj = VintedItem(**item)
            item_obj = await calculate_item_metrics(item_obj)
            items.append(item_obj)
        
        return items
    except Exception as e:
        logging.error(f"Error getting items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get items")

@api_router.get("/items/{item_id}", response_model=VintedItem)
async def get_item(item_id: str):
    """Get a specific item by ID"""
    try:
        item = await db.vinted_items.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item_obj = VintedItem(**item)
        item_obj = await calculate_item_metrics(item_obj)
        return item_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get item")

@api_router.put("/items/{item_id}", response_model=VintedItem)
async def update_item(item_id: str, item_update: VintedItemUpdate):
    """Update an existing item"""
    try:
        # Get existing item
        existing_item = await db.vinted_items.find_one({"id": item_id})
        if not existing_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Prepare update data
        update_data = {k: v for k, v in item_update.dict().items() if v is not None}
        
        # Handle status changes
        if item_update.status == ItemStatus.ACTIVE and existing_item.get("status") != ItemStatus.ACTIVE:
            update_data["listed_at"] = datetime.utcnow()
        elif item_update.status == ItemStatus.SOLD and existing_item.get("status") != ItemStatus.SOLD:
            update_data["sold_at"] = datetime.utcnow()
        
        # Update the item
        await db.vinted_items.update_one({"id": item_id}, {"$set": update_data})
        
        # Get updated item
        updated_item = await db.vinted_items.find_one({"id": item_id})
        item_obj = VintedItem(**updated_item)
        item_obj = await calculate_item_metrics(item_obj)
        
        # Check for profit alerts
        if item_obj.roi_percentage is not None and item_obj.roi_percentage < 20:  # Example threshold
            await create_notification(
                NotificationType.PROFIT_ALERT,
                "Low ROI Alert",
                f"Item '{item_obj.title}' has ROI of {item_obj.roi_percentage:.1f}%",
                {"item_id": item_id, "roi": item_obj.roi_percentage}
            )
        
        return item_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update item")

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    """Delete an item"""
    try:
        result = await db.vinted_items.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete item")

# Bulk Operations Routes
@api_router.post("/items/bulk-upload")
async def bulk_upload_items(bulk_data: BulkUpload):
    """Bulk upload items"""
    try:
        created_items = []
        for item_data in bulk_data.items:
            item = VintedItem(**item_data.dict())
            result = await db.vinted_items.insert_one(item.dict())
            created_items.append(item)
        
        return {"message": f"Successfully uploaded {len(created_items)} items", "items": created_items}
    except Exception as e:
        logging.error(f"Error bulk uploading items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload items")

@api_router.get("/items/export/csv")
async def export_items_csv():
    """Export items to CSV"""
    try:
        items_cursor = db.vinted_items.find({})
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Title', 'Brand', 'Category', 'Size', 'Condition', 
            'Purchase Price', 'Listed Price', 'Sold Price', 'Status',
            'Views', 'Likes', 'Created At', 'Listed At', 'Sold At'
        ])
        
        # Write data
        async for item in items_cursor:
            writer.writerow([
                item.get('id', ''),
                item.get('title', ''),
                item.get('brand', ''),
                item.get('category', ''),
                item.get('size', ''),
                item.get('condition', ''),
                item.get('purchase_price', 0),
                item.get('listed_price', 0),
                item.get('sold_price', ''),
                item.get('status', ''),
                item.get('views', 0),
                item.get('likes', 0),
                item.get('created_at', ''),
                item.get('listed_at', ''),
                item.get('sold_at', '')
            ])
        
        # Create response
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=vinted_items.csv"}
        )
    except Exception as e:
        logging.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export CSV")

# Analytics Routes
@api_router.get("/analytics/monthly", response_model=List[SalesAnalytics])
async def get_monthly_analytics():
    """Get monthly sales analytics"""
    try:
        analytics = await db.sales_analytics.find({}).to_list(1000)
        return [SalesAnalytics(**analytic) for analytic in analytics]
    except Exception as e:
        logging.error(f"Error getting monthly analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")

@api_router.get("/analytics/trends")
async def get_market_trends():
    """Get current market trends"""
    try:
        # This would typically pull from external data sources
        # For now, return sample trending data
        trends = [
            {
                "brand": "Stone Island",
                "trend_percentage": 35.0,
                "message": "Stone Island is trending up +35% - consider stocking more"
            },
            {
                "brand": "Armani",
                "trend_percentage": 25.0,
                "message": "Armani is trending up +25% - consider stocking more"
            }
        ]
        return trends
    except Exception as e:
        logging.error(f"Error getting market trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get trends")

@api_router.get("/analytics/performance/{item_id}")
async def get_item_performance(item_id: str):
    """Get detailed performance metrics for an item"""
    try:
        item = await db.vinted_items.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Calculate performance metrics
        performance = {
            "views_per_day": 0,
            "likes_per_day": 0,
            "engagement_rate": 0,
            "time_active": 0
        }
        
        if item.get("listed_at"):
            days_active = (datetime.utcnow() - item["listed_at"]).days or 1
            performance["views_per_day"] = item.get("views", 0) / days_active
            performance["likes_per_day"] = item.get("likes", 0) / days_active
            performance["time_active"] = days_active
            
            if item.get("views", 0) > 0:
                performance["engagement_rate"] = (item.get("likes", 0) / item.get("views", 1)) * 100
        
        return performance
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting item performance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get performance")

# Notification Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(unread_only: bool = False):
    """Get notifications"""
    try:
        query = {"read": False} if unread_only else {}
        notifications = await db.notifications.find(query).sort("created_at", -1).to_list(1000)
        return [Notification(**notification) for notification in notifications]
    except Exception as e:
        logging.error(f"Error getting notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get notifications")

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    try:
        result = await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"read": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

# Expense Tracking Routes
@api_router.post("/expenses", response_model=ItemExpense)
async def create_expense(expense: ItemExpense):
    """Create a new expense"""
    try:
        result = await db.item_expenses.insert_one(expense.dict())
        return expense
    except Exception as e:
        logging.error(f"Error creating expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create expense")

@api_router.get("/expenses/item/{item_id}", response_model=List[ItemExpense])
async def get_item_expenses(item_id: str):
    """Get expenses for a specific item"""
    try:
        expenses = await db.item_expenses.find({"item_id": item_id}).to_list(1000)
        return [ItemExpense(**expense) for expense in expenses]
    except Exception as e:
        logging.error(f"Error getting item expenses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get expenses")

# ROI Target Routes
@api_router.post("/roi-targets", response_model=ROITarget)
async def create_roi_target(target: ROITarget):
    """Create or update ROI target"""
    try:
        result = await db.roi_targets.insert_one(target.dict())
        return target
    except Exception as e:
        logging.error(f"Error creating ROI target: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create ROI target")

@api_router.get("/roi-targets/current", response_model=ROITarget)
async def get_current_roi_target():
    """Get current active ROI target"""
    try:
        target = await db.roi_targets.find_one({"is_active": True})
        if not target:
            # Create default target
            default_target = ROITarget(target_percentage=30.0)
            await db.roi_targets.insert_one(default_target.dict())
            return default_target
        return ROITarget(**target)
    except Exception as e:
        logging.error(f"Error getting ROI target: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get ROI target")

# Automated Tasks Routes
@api_router.post("/tasks/check-renewals")
async def check_renewal_reminders():
    """Check for items that need renewal reminders"""
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Find items that need renewal
        items_cursor = db.vinted_items.find({
            "status": ItemStatus.ACTIVE,
            "renewal_reminder_sent": False,
            "$or": [
                {"last_renewed_at": {"$lt": thirty_days_ago}},
                {"last_renewed_at": {"$exists": False}, "listed_at": {"$lt": thirty_days_ago}}
            ]
        })
        
        renewal_count = 0
        async for item in items_cursor:
            # Create renewal reminder notification
            await create_notification(
                NotificationType.LISTING_RENEWAL,
                "Listing Renewal Reminder",
                f"Consider renewing '{item['title']}' - it's been active for 30+ days",
                {"item_id": item["id"]}
            )
            
            # Mark reminder as sent
            await db.vinted_items.update_one(
                {"id": item["id"]},
                {"$set": {"renewal_reminder_sent": True}}
            )
            renewal_count += 1
        
        return {"message": f"Sent {renewal_count} renewal reminders"}
    except Exception as e:
        logging.error(f"Error checking renewals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check renewals")

@api_router.post("/tasks/check-roi-alerts")
async def check_roi_alerts():
    """Check for low ROI items and send alerts"""
    try:
        # Get current ROI target
        target = await db.roi_targets.find_one({"is_active": True})
        target_percentage = target["target_percentage"] if target else 20.0
        
        # Find items with low ROI that haven't been alerted
        items_cursor = db.vinted_items.find({
            "status": ItemStatus.SOLD,
            "low_roi_alert_sent": False,
            "sold_price": {"$exists": True}
        })
        
        alert_count = 0
        async for item in items_cursor:
            # Calculate ROI
            costs = (item.get("purchase_price", 0) + item.get("shipping_cost", 0) + 
                    item.get("vinted_fee", 0) + item.get("buyer_protection_fee", 0))
            if item.get("purchase_price", 0) > 0:
                profit = item.get("sold_price", 0) - costs
                roi = (profit / item["purchase_price"]) * 100
                
                if roi < target_percentage:
                    # Send low ROI alert
                    await create_notification(
                        NotificationType.PROFIT_ALERT,
                        "Low ROI Alert",
                        f"'{item['title']}' sold with {roi:.1f}% ROI (target: {target_percentage}%)",
                        {"item_id": item["id"], "roi": roi, "target": target_percentage}
                    )
                    
                    # Mark alert as sent
                    await db.vinted_items.update_one(
                        {"id": item["id"]},
                        {"$set": {"low_roi_alert_sent": True}}
                    )
                    alert_count += 1
        
        return {"message": f"Sent {alert_count} ROI alerts"}
    except Exception as e:
        logging.error(f"Error checking ROI alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check ROI alerts")

# Legacy routes for backward compatibility
@api_router.get("/")
async def root():
    return {"message": "Vinted Tracker API v2.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
