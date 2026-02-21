from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, bcrypt
from app.models import User
from sqlalchemy import inspect

auth_bp = Blueprint('auth', __name__)

def check_db_initialized():
    inspector = inspect(db.engine)
    return inspector.has_table("user")

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if not check_db_initialized():
        return redirect(url_for('auth.initialize_db'))

    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            if user.must_change_password:
                flash('You must change your password before continuing.', 'warning')
                return redirect(url_for('auth.change_password'))
            return redirect(url_for('main.index'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/initialize_db', methods=['GET', 'POST'])
def initialize_db():
    if check_db_initialized():
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        db.create_all()
        # Create default admin
        hashed_password = bcrypt.generate_password_hash('12345').decode('utf-8')
        admin = User(username='admin', password_hash=hashed_password, is_admin=True, must_change_password=True)
        db.session.add(admin)
        db.session.commit()
        flash('Database initialized successfully. Please login with admin/12345', 'success')
        return redirect(url_for('auth.login'))

    return render_template('initialize.html')

@auth_bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        if new_password != confirm_password:
            flash('Passwords do not match', 'danger')
        else:
            hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
            current_user.password_hash = hashed_password
            current_user.must_change_password = False
            db.session.commit()
            flash('Password updated successfully', 'success')
            return redirect(url_for('main.index'))
    return render_template('change_password.html')
