<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

try {
    $pdo = getDBConnection();

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // In a real application, generate a reset token and send email
    // For demo purposes, just return success
    echo json_encode(['message' => 'Password reset link sent to your email']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process request']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\forgot-password.php