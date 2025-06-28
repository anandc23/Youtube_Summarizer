from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

# In-memory user storage for demonstration purposes
users = {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in users:
        return jsonify({"error": "User already exists"}), 400
    
    users[username] = generate_password_hash(password)
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username not in users or not check_password_hash(users[username], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    session['user'] = username
    return jsonify({"message": "Login successful"}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route('/status', methods=['GET'])
def status():
    if 'user' in session:
        return jsonify({"status": "Logged in", "user": session['user']}), 200
    return jsonify({"status": "Not logged in"}), 200