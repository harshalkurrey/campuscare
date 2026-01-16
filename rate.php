<?php
require_once 'config.php';

$user = getAuthUser();
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$submissionId = $_GET['submissionId'] ?? '';
$rating = $data['rating'] ?? '';

if (empty($submissionId) || !is_numeric($rating) || $rating < 1 || $rating > 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid submission ID and rating (1-10) are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE submissions SET rating = ? WHERE id = ? AND user_id = ?");
    $stmt->execute([$rating, $submissionId, $user['id']]);

    echo json_encode(['message' => 'Rating submitted successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to submit rating']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\rate.php