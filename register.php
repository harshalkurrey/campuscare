<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? '';
$erp = $data['erp'] ?? null;
$course = $data['course'] ?? null;
$adminCode = $data['adminCode'] ?? '';

if (empty($name) || empty($email) || empty($password) || empty($role)) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

if ($role === 'admin' && $adminCode !== 'ADMIN2025') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid admin code']);
    exit;
}

try {
    $pdo = getDBConnection();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND role = ?");
    $stmt->execute([$email, $role]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'User already exists']);
        exit;
    }

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, erp, course) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, hashPassword($password), $role, $erp, $course]);

    echo json_encode(['message' => 'User registered successfully', 'userId' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\register.php