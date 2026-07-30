import pandas as pd
import numpy as np
import sys
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, mean_squared_error, r2_score

sys.stdout.reconfigure(encoding='utf-8')
# ==============================================================================
# BƯỚC 1: ĐỌC DỮ LIỆU & TIỀN XỬ LÝ (THAY THẾ Ở ĐÂY KHI CHÉP VÀO BÀI)
# ==============================================================================
# BƯỚC 1.1: Sửa tên file CSV đề cho (VD: 'PlayTennis.csv', 'winequality.csv', 'data_linear.csv')
FILE_PATH = 'dataset.csv' 

try:
    df = pd.read_csv(FILE_PATH)
    print("Đã đọc dữ liệu thành công từ:", FILE_PATH)
except:
    print("Không tìm thấy file.")
    # Dữ liệu giả lập (Hãy xóa phần except này nếu làm bài thật)
    from sklearn.datasets import load_iris
    data = load_iris()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    df['target'] = data.target

# BƯỚC 1.2: Chỉ định cột TARGET (Cột cần dự đoán) - RẤT QUAN TRỌNG
# Thay bằng tên cột trong đề (ví dụ: 'Play ball', 'Giá', 'quality')
TARGET_COLUMN = 'target' 

if TARGET_COLUMN in df.columns:
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]
else:
    # Mặc định lấy cột cuối cùng làm nhãn nếu quên chưa đổi tên Target
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]

# BƯỚC 1.3: Encode dữ liệu chữ (Label Encoding / One-Hot Encoding)
# Nếu đề có cột chữ (Sunny, Rain,...), hàm này tự đổi ra số để Model chạy được
X = pd.get_dummies(X)

# BƯỚC 1.4: Chia tập Train / Test (Đọc kỹ đề xem tỉ lệ bao nhiêu)
# Đề HaUI thường yêu cầu 70-30 hoặc 80-20. Sửa test_size bên dưới:
TEST_SIZE = 0.3 # 0.3 = 70/30 | 0.2 = 80/20
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=42)


# ==============================================================================
# BƯỚC 2: CÁC DẠNG BÀI TẬP (ĐỀ VÀO DẠNG NÀO THÌ CHẠY HÀM ĐÓ)
# ==============================================================================

# ---------------------------------------------------------
# DẠNG 1: PHÂN LỚP DỰA TRÊN XÁC SUẤT (NAIVE BAYES)
# Dấu hiệu nhận biết: Đề nhắc đến "Xác suất", "Naive Bayes", "GaussianNB"
# ---------------------------------------------------------
def run_naive_bayes():
    print("\n" + "-"*40)
    print("KẾT QUẢ: MÔ HÌNH NAIVE BAYES (XÁC SUẤT)")
    model = GaussianNB()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # In các độ đo hiệu năng theo chuẩn Slide Bài 12
    print("- Độ chính xác (Accuracy): %.3f" % accuracy_score(y_test, y_pred))
    print("- Precision: %.3f" % precision_score(y_test, y_pred, average='weighted', zero_division=0))
    print("- Recall: %.3f" % recall_score(y_test, y_pred, average='weighted', zero_division=0))
    print("- F1-Score: %.3f" % f1_score(y_test, y_pred, average='weighted', zero_division=0))
    print("- Ma trận nhầm lẫn (Confusion Matrix):\n", confusion_matrix(y_test, y_pred))

# ---------------------------------------------------------
# DẠNG 2: CÂY QUYẾT ĐỊNH (DECISION TREE / ID3)
# Dấu hiệu nhận biết: Đề nhắc đến "Cây quyết định", "ID3", "CART", "entropy"
# ---------------------------------------------------------
def run_decision_tree():
    print("\n" + "-"*40)
    print("KẾT QUẢ: MÔ HÌNH CÂY QUYẾT ĐỊNH (ID3)")
    # Thường ở bài tập HaUI dùng criterion='entropy' cho ID3 hoặc 'gini' cho CART
    model = DecisionTreeClassifier(criterion='entropy', random_state=42) 
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    print("- Độ chính xác (Accuracy): %.3f" % accuracy_score(y_test, y_pred))
    print("- Báo cáo chi tiết (Classification Report):\n")
    print(classification_report(y_test, y_pred, zero_division=0))

# ---------------------------------------------------------
# DẠNG 3: HỒI QUY LOGISTIC (LOGISTIC REGRESSION)
# Dấu hiệu nhận biết: Đề bài phân loại nhị phân (Yes/No, Đậu/Rớt) + "Logistic"
# ---------------------------------------------------------
def run_logistic_regression():
    print("\n" + "-"*40)
    print("KẾT QUẢ: MÔ HÌNH HỒI QUY LOGISTIC")
    model = LogisticRegression(max_iter=1000) # max_iter=1000 để tránh lỗi hội tụ
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    print("- Độ chính xác (Accuracy): %.3f" % accuracy_score(y_test, y_pred))
    print("- F1-Score: %.3f" % f1_score(y_test, y_pred, average='weighted', zero_division=0))
    print("- Báo cáo chi tiết:\n", classification_report(y_test, y_pred, zero_division=0))

# ---------------------------------------------------------
# DẠNG 4: HỒI QUY TUYẾN TÍNH (LINEAR REGRESSION)
# Dấu hiệu nhận biết: Cột mục tiêu KHÔNG PHẢI LÀ CHỮ mà là SỐ LIÊN TỤC (VD: Giá nhà)
# ---------------------------------------------------------
def run_linear_regression():
    print("\n" + "-"*40)
    print("KẾT QUẢ: MÔ HÌNH HỒI QUY TUYẾN TÍNH")
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # In ra phương trình: y = w1*x1 + w2*x2 + ... + w0
    print("- Hệ số (w):", model.coef_)
    print("- Sai số (w0):", model.intercept_)
    print("- Sai số toàn phương trung bình (MSE): %.3f" % mean_squared_error(y_test, y_pred))
    print("- R-squared (R2 Score): %.3f" % r2_score(y_test, y_pred))

# MAIN

if __name__ == "__main__":
    print("Khởi động Tool ML All-In-One...")
    
    # Bỏ comment (xóa dấu #) dòng nào bạn muốn chạy:
    
    run_naive_bayes()
    run_decision_tree()
    run_logistic_regression()
    
    # Chỉ chạy Hồi quy tuyến tính nếu target là số liên tục (như bài diện tích - giá)
    # run_linear_regression()
