from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient

auth_bp = Blueprint('auth', __name__)
client = MongoClient("mongodb://localhost:27017/")
db = client['yt_summarizer']
users = db['users']

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if users.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 409
    hashed_pw = generate_password_hash(password)
    users.insert_one({'username': username, 'password': hashed_pw})
    return jsonify({'message': 'Registration successful'})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = users.find_one({'username': username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    session['username'] = username
    return jsonify({'message': 'Login successful'})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'message': 'Logged out'})
