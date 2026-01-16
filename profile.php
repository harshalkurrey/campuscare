<?php
require_once 'config.php';

$user = getAuthUser();
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user profile
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role, erp, course FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }

        echo json_encode($profile);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get profile']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update user profile
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $erp = $data['erp'] ?? null;
        $course = $data['course'] ?? null;
        $password = $data['password'] ?? '';

        if (empty($name) || empty($email)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and email are required']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            exit;
        }

        if (!empty($password)) {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, erp = ?, course = ?, password = ? WHERE id = ?");
            $stmt->execute([$name, $email, $erp, $course, hashPassword($password), $user['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, erp = ?, course = ? WHERE id = ?");
            $stmt->execute([$name, $email, $erp, $course, $user['id']]);
        }

        echo json_encode(['message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\profile.php