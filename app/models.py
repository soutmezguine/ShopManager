from datetime import datetime
from app import db, login_manager
from flask_login import UserMixin

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    must_change_password = db.Column(db.Boolean, default=False)

class AppointmentCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    appointments = db.relationship('Appointment', backref='category', lazy=True)

class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    orders = db.relationship('Order', backref='vendor', lazy=True)
    returns = db.relationship('Return', backref='vendor', lazy=True)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('appointment_category.id'), nullable=False)
    notes = db.Column(db.Text)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    ro = db.Column(db.String(50), nullable=False)
    parts = db.Column(db.Text, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    rep = db.Column(db.String(100))
    delivery_date = db.Column(db.Date)
    delivery_status = db.Column(db.String(20), default='Pending') # Pending, Arrived, Cancelled, Returned, Exchanged
    amount_paid = db.Column(db.Float)
    check_number = db.Column(db.String(50))

    user = db.relationship('User', backref='orders')

class Return(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    ro = db.Column(db.String(50), nullable=False)
    parts = db.Column(db.Text, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    rep = db.Column(db.String(100))
    pickup_status = db.Column(db.String(20), default='Pending') # Pending, Picked Up

    user = db.relationship('User', backref='returns')

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
