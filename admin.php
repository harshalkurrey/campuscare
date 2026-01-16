<?php
require_once 'config.php';

$user = getAuthUser();

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all submissions for admin
    try {
        $filter = $_GET['filter'] ?? 'all';
        $query = "
            SELECT s.*, u.name as user_name, u.email, u.erp, u.course
            FROM submissions s
            JOIN users u ON s.user_id = u.id
        ";
        $params = [];

        if ($filter === 'urgent') {
            $query .= " WHERE s.urgent = 1";
        } elseif ($filter !== 'all') {
            $query .= " WHERE s.status = ?";
            $params[] = $filter;
        }

        $query .= " ORDER BY s.created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($submissions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get submissions']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update submission status
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $submissionId = $_GET['id'] ?? '';
        $status = $data['status'] ?? '';
        $response = $data['response'] ?? '';

        if (empty($submissionId) || empty($status)) {
            http_response_code(400);
            echo json_encode(['error' => 'Submission ID and status are required']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE submissions SET status = ?, admin_response = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $response, $submissionId]);

        // Award points to admin if resolved
        if ($status === 'resolved') {
            $stmt = $pdo->prepare("UPDATE users SET admin_points = admin_points + 10 WHERE id = ?");
            $stmt->execute([$user['id']]);
        }

        echo json_encode(['message' => 'Submission updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update submission']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['stats'])) {
    // Get admin stats
    try {
        $stmt = $pdo->prepare("
            SELECT
                COUNT(*) as total_submissions,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_submissions,
                AVG(rating) as average_rating,
                SUM(CASE WHEN urgent = 1 THEN 1 ELSE 0 END) as urgent_submissions
            FROM submissions
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT admin_points FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(array_merge($stats, ['admin_points' => $userData['admin_points']]));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get stats']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\admin.php