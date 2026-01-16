<?php
require_once 'config.php';

$user = getAuthUser();
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user submissions
    try {
        $filter = $_GET['filter'] ?? 'all';
        $query = "SELECT * FROM submissions WHERE user_id = ?";
        $params = [$user['id']];

        if ($filter === 'urgent') {
            $query .= " AND urgent = 1";
        } elseif ($filter !== 'all') {
            $query .= " AND status = ?";
            $params[] = $filter;
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($submissions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get submissions']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new submission
    try {
        $type = $_POST['type'] ?? '';
        $category = $_POST['category'] ?? '';
        $description = $_POST['description'] ?? '';
        $urgent = isset($_POST['urgent']) && $_POST['urgent'] === 'true';

        if (empty($type) || empty($category) || empty($description)) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            exit;
        }

        $filePath = null;
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = time() . '_' . basename($_FILES['file']['name']);
            $filePath = $uploadDir . $fileName;

            if (!move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
                http_response_code(500);
                echo json_encode(['error' => 'File upload failed']);
                exit;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO submissions (user_id, type, category, description, urgent, file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user['id'], $type, $category, $description, $urgent, $filePath, 'new']);

        echo json_encode(['message' => 'Submission created successfully', 'submissionId' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create submission']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?></content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\php-backend\submissions.php