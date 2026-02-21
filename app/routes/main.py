from flask import Blueprint, render_template, request, jsonify, flash, url_for, redirect
from flask_login import login_required, current_user
from datetime import datetime
from app import db
from app.models import User, Task, Appointment, AppointmentCategory, Order, Vendor, Return

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')

@main_bp.route('/appointments')
@login_required
def appointments():
    categories = AppointmentCategory.query.all()
    return render_template('appointments.html', categories=categories)

@main_bp.route('/api/appointments')
@login_required
def get_appointments_api():
    start = request.args.get('start')
    end = request.args.get('end')
    # FullCalendar sends ISO8601 strings
    query = Appointment.query
    if start:
        query = query.filter(Appointment.date >= datetime.fromisoformat(start.replace('Z', '+00:00')))
    if end:
        query = query.filter(Appointment.date <= datetime.fromisoformat(end.replace('Z', '+00:00')))

    apps = query.all()
    return jsonify([{
        'id': a.id,
        'title': f"{a.customer_name} ({a.category.name})",
        'start': a.date.isoformat(),
        'extendedProps': {
            'customer_name': a.customer_name,
            'category_id': a.category_id,
            'notes': a.notes
        }
    } for a in apps])

@main_bp.route('/api/appointments/add', methods=['POST'])
@login_required
def add_appointment():
    data = request.form
    new_app = Appointment(
        customer_name=data.get('customer_name'),
        date=datetime.fromisoformat(data.get('date')),
        category_id=int(data.get('category_id')),
        notes=data.get('notes')
    )
    db.session.add(new_app)
    db.session.commit()
    flash('Appointment added.', 'success')
    return redirect(url_for('main.appointments'))

@main_bp.route('/api/appointments/update/<int:id>', methods=['POST'])
@login_required
def update_appointment(id):
    appo = Appointment.query.get_or_404(id)
    data = request.get_json()
    if 'date' in data:
        appo.date = datetime.fromisoformat(data.get('date').replace('Z', '+00:00'))
    db.session.commit()
    return jsonify({'status': 'success'})

@main_bp.route('/api/appointments/delete/<int:id>', methods=['POST'])
@login_required
def delete_appointment(id):
    appo = Appointment.query.get_or_404(id)
    db.session.delete(appo)
    db.session.commit()
    return jsonify({'status': 'success'})

# Orders API
@main_bp.route('/api/orders')
@login_required
def get_orders_api():
    orders = Order.query.all()
    return jsonify([{
        'id': o.id,
        'username': o.user.username,
        'date': o.date.strftime('%m/%d/%y'),
        'ro': o.ro,
        'parts': o.parts,
        'vendor_name': o.vendor.name,
        'rep': o.rep,
        'delivery_date': o.delivery_date.strftime('%m/%d/%y') if o.delivery_date else '',
        'delivery_status': o.delivery_status,
        'amount_paid': o.amount_paid or 0,
        'check_number': o.check_number or ''
    } for o in orders])

@main_bp.route('/api/orders/add', methods=['POST'])
@login_required
def add_order():
    data = request.form
    new_order = Order(
        user_id=int(data.get('user_id')),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date(),
        ro=data.get('ro'),
        parts=data.get('parts'),
        vendor_id=int(data.get('vendor_id')),
        rep=data.get('rep'),
        delivery_date=datetime.strptime(data.get('delivery_date'), '%Y-%m-%d').date() if data.get('delivery_date') else None,
        delivery_status=data.get('delivery_status'),
        amount_paid=float(data.get('amount_paid')) if data.get('amount_paid') else None,
        check_number=data.get('check_number')
    )
    db.session.add(new_order)
    db.session.commit()
    flash('Order added.', 'success')
    return redirect(url_for('main.orders'))

@main_bp.route('/api/orders/delete/<int:id>', methods=['POST'])
@login_required
def delete_order(id):
    order = Order.query.get_or_404(id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'status': 'success'})

# Returns API
@main_bp.route('/api/returns')
@login_required
def get_returns_api():
    returns = Return.query.all()
    return jsonify([{
        'id': r.id,
        'username': r.user.username,
        'date': r.date.strftime('%m/%d/%y'),
        'ro': r.ro,
        'parts': r.parts,
        'vendor_name': r.vendor.name,
        'rep': r.rep,
        'pickup_status': r.pickup_status
    } for r in returns])

@main_bp.route('/api/returns/add', methods=['POST'])
@login_required
def add_return():
    data = request.form
    new_return = Return(
        user_id=int(data.get('user_id')),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date(),
        ro=data.get('ro'),
        parts=data.get('parts'),
        vendor_id=int(data.get('vendor_id')),
        rep=data.get('rep'),
        pickup_status=data.get('pickup_status')
    )
    db.session.add(new_return)
    db.session.commit()
    flash('Return added.', 'success')
    return redirect(url_for('main.returns'))

@main_bp.route('/api/returns/delete/<int:id>', methods=['POST'])
@login_required
def delete_return(id):
    ret = Return.query.get_or_404(id)
    db.session.delete(ret)
    db.session.commit()
    return jsonify({'status': 'success'})

@main_bp.route('/orders')
@login_required
def orders():
    vendors = Vendor.query.all()
    users = User.query.all()
    now_date = datetime.now().strftime('%Y-%m-%d')
    return render_template('orders.html', vendors=vendors, users=users, now_date=now_date)

@main_bp.route('/returns')
@login_required
def returns():
    vendors = Vendor.query.all()
    users = User.query.all()
    now_date = datetime.now().strftime('%Y-%m-%d')
    return render_template('returns.html', vendors=vendors, users=users, now_date=now_date)

# Task Routes
@main_bp.route('/tasks')
@login_required
def get_tasks():
    tasks = Task.query.order_by(Task.date_created.desc()).all()
    return jsonify([{'id': t.id, 'content': t.content, 'is_completed': t.is_completed} for t in tasks])

@main_bp.route('/tasks/add', methods=['POST'])
@login_required
def add_task():
    data = request.get_json()
    if data and data.get('content'):
        task = Task(content=data['content'])
        db.session.add(task)
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error'}), 400

@main_bp.route('/tasks/toggle/<int:task_id>', methods=['POST'])
@login_required
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.is_completed = not task.is_completed
    db.session.commit()
    return jsonify({'status': 'success'})

@main_bp.route('/tasks/delete/<int:task_id>', methods=['POST'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'status': 'success'})
