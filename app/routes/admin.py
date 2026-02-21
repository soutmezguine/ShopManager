from flask import Blueprint, render_template, redirect, url_for, flash, request, send_file
from flask_login import login_required, current_user
from app import db, bcrypt
from app.models import User, AppointmentCategory, Vendor
from functools import wraps
import os
import shutil
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin access required.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/users')
@login_required
@admin_required
def users():
    all_users = User.query.all()
    return render_template('admin/users.html', users=all_users)

@admin_bp.route('/users/add', methods=['GET', 'POST'])
@login_required
@admin_required
def add_user():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        is_admin = True if request.form.get('is_admin') else False

        user_exists = User.query.filter_by(username=username).first()
        if user_exists:
            flash('Username already exists.', 'danger')
        else:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user = User(username=username, password_hash=hashed_password, is_admin=is_admin, must_change_password=True)
            db.session.add(new_user)
            db.session.commit()
            flash('User added successfully. They will be prompted to change their password on first login.', 'success')
            return redirect(url_for('admin.users'))
    return render_template('admin/add_user.html')

@admin_bp.route('/users/reset_password/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def reset_password(user_id):
    user = User.query.get_or_404(user_id)
    new_password = '12345'
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.password_hash = hashed_password
    user.must_change_password = True
    db.session.commit()
    flash(f'Password for {user.username} has been reset to 12345.', 'success')
    return redirect(url_for('admin.users'))

@admin_bp.route('/backup_restore')
@login_required
@admin_required
def backup_restore():
    backups = []
    if os.path.exists('backups'):
        backups = sorted(os.listdir('backups'), reverse=True)
    return render_template('admin/backup_restore.html', backups=backups)

@admin_bp.route('/backup', methods=['POST'])
@login_required
@admin_required
def backup_db():
    if not os.path.exists('backups'):
        os.makedirs('backups')

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'shop_backup_{timestamp}.db'
    db_path = os.path.join('instance', 'shop.db')
    backup_path = os.path.join('backups', backup_filename)

    try:
        shutil.copy2(db_path, backup_path)
        flash(f'Backup created successfully: {backup_filename}', 'success')
    except Exception as e:
        flash(f'Error creating backup: {str(e)}', 'danger')

    return redirect(url_for('admin.backup_restore'))

@admin_bp.route('/restore/<filename>', methods=['POST'])
@login_required
@admin_required
def restore_db(filename):
    filename = os.path.basename(filename)
    backup_path = os.path.join('backups', filename)
    db_path = os.path.join('instance', 'shop.db')

    if not os.path.exists(backup_path):
        flash('Backup file not found.', 'danger')
        return redirect(url_for('admin.backup_restore'))

    try:
        # Before restoring, we should probably close connections, but in SQLite we can usually just overwrite the file if not in use.
        # However, a better way is to copy it over.
        shutil.copy2(backup_path, db_path)
        flash('Database restored successfully. You may need to log in again.', 'success')
    except Exception as e:
        flash(f'Error restoring database: {str(e)}', 'danger')

    return redirect(url_for('admin.backup_restore'))

@admin_bp.route('/download_backup/<filename>')
@login_required
@admin_required
def download_backup(filename):
    filename = os.path.basename(filename)
    backup_path = os.path.join('backups', filename)
    if os.path.exists(backup_path):
        return send_file(os.path.abspath(backup_path), as_attachment=True)
    else:
        flash('File not found.', 'danger')
        return redirect(url_for('admin.backup_restore'))

@admin_bp.route('/delete_backup/<filename>', methods=['POST'])
@login_required
@admin_required
def delete_backup(filename):
    filename = os.path.basename(filename)
    backup_path = os.path.join('backups', filename)
    if os.path.exists(backup_path):
        os.remove(backup_path)
        flash('Backup deleted successfully.', 'success')
    else:
        flash('File not found.', 'danger')
    return redirect(url_for('admin.backup_restore'))

@admin_bp.route('/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def categories_vendors():
    categories = AppointmentCategory.query.all()
    vendors = Vendor.query.all()
    return render_template('admin/settings.html', categories=categories, vendors=vendors)

@admin_bp.route('/categories/add', methods=['POST'])
@login_required
@admin_required
def add_category():
    name = request.form.get('name')
    if name:
        if not AppointmentCategory.query.filter_by(name=name).first():
            category = AppointmentCategory(name=name)
            db.session.add(category)
            db.session.commit()
            flash('Category added.', 'success')
        else:
            flash('Category already exists.', 'danger')
    return redirect(url_for('admin.categories_vendors'))

@admin_bp.route('/categories/delete/<int:id>', methods=['POST'])
@login_required
@admin_required
def delete_category(id):
    category = AppointmentCategory.query.get_or_404(id)
    if category.appointments:
        flash('Cannot delete category with associated appointments.', 'danger')
    else:
        db.session.delete(category)
        db.session.commit()
        flash('Category deleted.', 'success')
    return redirect(url_for('admin.categories_vendors'))

@admin_bp.route('/vendors/add', methods=['POST'])
@login_required
@admin_required
def add_vendor():
    name = request.form.get('name')
    if name:
        if not Vendor.query.filter_by(name=name).first():
            vendor = Vendor(name=name)
            db.session.add(vendor)
            db.session.commit()
            flash('Vendor added.', 'success')
        else:
            flash('Vendor already exists.', 'danger')
    return redirect(url_for('admin.categories_vendors'))

@admin_bp.route('/vendors/delete/<int:id>', methods=['POST'])
@login_required
@admin_required
def delete_vendor(id):
    vendor = Vendor.query.get_or_404(id)
    if vendor.orders or vendor.returns:
        flash('Cannot delete vendor with associated orders or returns.', 'danger')
    else:
        db.session.delete(vendor)
        db.session.commit()
        flash('Vendor deleted.', 'success')
    return redirect(url_for('admin.categories_vendors'))

@admin_bp.route('/users/delete/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('You cannot delete yourself.', 'danger')
    else:
        db.session.delete(user)
        db.session.commit()
        flash('User deleted successfully.', 'success')
    return redirect(url_for('admin.users'))
