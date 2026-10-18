-- ============================================================================
-- SEED DATA: POINT_CATEGORIES (TIÊU CHÍ ĐÁNH GIÁ ĐIỂM RÈN LUYỆN ĐHCT)
-- Khớp 100% thứ tự cột trong schema.sql:
-- id, name, note, maximum, is_active, date_apply, level, children_order, parent_category_id
-- ============================================================================

-- Xóa dữ liệu cũ nếu muốn reset
TRUNCATE TABLE point_categories RESTART IDENTITY CASCADE;

INSERT INTO point_categories 
    (id, name, note, maximum, is_active, date_apply, level, children_order, parent_category_id)
OVERRIDING SYSTEM VALUE VALUES

-- ============================================================================
-- I. TRÁCH NHIỆM, TINH THẦN VÀ THÁI ĐỘ TRONG HỌC TẬP (Tối đa 20 điểm)
-- ============================================================================
(1, 'I. Trách nhiệm, tinh thần và thái độ trong học tập', 'Mã tiêu chí: I', 20, TRUE, CURRENT_DATE, 0, 1, NULL),

  -- I.a
  (10, 'a. Trách nhiệm và thái độ tham gia các hoạt động học tập, hoạt động nghiên cứu khoa học', 'Mã tiêu chí: I.a', 20, TRUE, CURRENT_DATE, 1, 1, 1),
    (101, 'Đi học đầy đủ, đúng giờ, nghiêm túc trong giờ học', 'Mỗi học phần bị cấm thi trừ 03 điểm', 6, TRUE, CURRENT_DATE, 2, 1, 10),
    
    -- I.a.2
    (102, 'Nghiên cứu khoa học (NCKH)', 'Mã tiêu chí: I.a.2', 8, TRUE, CURRENT_DATE, 2, 2, 10),
      (1021, 'Có tham gia đề tài NCKH của đơn vị đào tạo và cấp tương đương trở lên, có quyết định của phòng KH, CN& ĐMST', 'Không tính bài tập, tiểu luận, đồ án môn học, luận văn...', 5, TRUE, CURRENT_DATE, 3, 1, 102),
      (1022, 'Chủ nhiệm đề tài NCKH', NULL, 8, TRUE, CURRENT_DATE, 3, 2, 102),
      (1023, 'Có bài báo NCKH trong và ngoài nước', NULL, 8, TRUE, CURRENT_DATE, 3, 3, 102),

    -- I.a.3
    (103, 'Hoàn thành chứng chỉ tin học', 'Mã tiêu chí: I.a.3', 5, TRUE, CURRENT_DATE, 2, 3, 10),
      (1031, 'Chứng chỉ tin học: Cơ bản và tương đương', NULL, 3, TRUE, CURRENT_DATE, 3, 1, 103),
      (1032, 'Chứng chỉ tin học: Nâng cao', NULL, 5, TRUE, CURRENT_DATE, 3, 2, 103),

    -- I.a.4
    (104, 'Hoàn thành chứng chỉ ngoại ngữ', 'Mã tiêu chí: I.a.4', 10, TRUE, CURRENT_DATE, 2, 4, 10),
      (1041, 'Ngoại ngữ không chuyên: Bậc 1 (A1), TOEIC (L&R): 120-220, TOEFL CBT: 60, KET: 100-120', 'Khung NLNN 6 bậc VN – Bậc 1 (A1) • TOEIC Bridge: 30-42', 3, TRUE, CURRENT_DATE, 3, 1, 104),
      (1042, 'Ngoại ngữ không chuyên: Bậc 2 (A2), IELTS: 4.0, TOEIC: 225-445, TOEFL ITP: 360-449', 'Khung NLNN 6 bậc VN – Bậc 2 (A2) • TOEFL CBT: 96 • TOEFL iBT: 30 • KET/PET: 120-140', 5, TRUE, CURRENT_DATE, 3, 2, 104),
      (1043, 'Ngoại ngữ không chuyên: Bậc 3 (B1), IELTS: 4.5-5.0, TOEIC: 450-595, TOEFL ITP: 450-499', 'Khung NLNN 6 bậc VN – Bậc 3 (B1) • TOEFL CBT: 133 • TOEFL iBT: 31-45 • FCE: 140-160', 7, TRUE, CURRENT_DATE, 3, 3, 104),
      (1044, 'Ngoại ngữ không chuyên: Bậc 4 (B2) trở lên, IELTS: >= 5.5, TOEIC: >= 600, TOEFL ITP: >= 500', 'Khung NLNN 6 bậc VN – Bậc 4 (B2) • TOEFL CBT: >= 173 • TOEFL iBT: >= 46 • CAE/CPE', 10, TRUE, CURRENT_DATE, 3, 4, 104),
      (1045, 'Tham gia các CLB học thuật', NULL, 2, TRUE, CURRENT_DATE, 3, 5, 104),

  -- I.b
  (11, 'b. Trách nhiệm và tinh thần tham gia các kỳ thi, cuộc thi', 'Mã tiêu chí: I.b', 10, TRUE, CURRENT_DATE, 1, 2, 1),
    (111, 'Không vi phạm quy chế về thi, kiểm tra', 'Mỗi lần vi phạm trừ 03 điểm', 6, TRUE, CURRENT_DATE, 2, 1, 11),
    
    -- I.b.2
    (112, 'Tham gia các kỳ thi chuyên ngành, thi Olympic...', 'Mã tiêu chí: I.b.2', 4, TRUE, CURRENT_DATE, 2, 2, 11),
      (1121, 'Có tham gia kỳ thi', NULL, 2, TRUE, CURRENT_DATE, 3, 1, 112),
      (1122, 'Đạt giải cấp Đại học/ Đơn vị đào tạo/ Cấp cơ sở', NULL, 4, TRUE, CURRENT_DATE, 3, 2, 112),

  -- I.c
  (12, 'c. Tinh thần vượt khó, phấn đấu vươn lên trong học tập', 'Mã tiêu chí: I.c', 10, TRUE, CURRENT_DATE, 1, 3, 1),
    (121, 'Có cố gắng, vượt khó trong học tập', 'Có ĐTB học kỳ sau lớn hơn học kỳ trước đó; đối với SV năm thứ nhất, học kỳ I không có điểm dưới 4', 2, TRUE, CURRENT_DATE, 2, 1, 12),
    
    -- I.c.2
    (122, 'Kết quả học tập trong học kỳ', 'Mã tiêu chí: I.c.2', 8, TRUE, CURRENT_DATE, 2, 2, 12),
      (1221, 'Điểm trung bình chung học kỳ (ĐTBCHK) đạt >= 3,60', NULL, 8, TRUE, CURRENT_DATE, 3, 1, 122),
      (1222, 'ĐTBCHK đạt từ 3,20 đến 3,59', NULL, 6, TRUE, CURRENT_DATE, 3, 2, 122),
      (1223, 'ĐTBCHK đạt từ 2,50 đến 3,19', NULL, 4, TRUE, CURRENT_DATE, 3, 3, 122),
      (1224, 'ĐTBCHK đạt từ 2,00 đến 2,49', NULL, 2, TRUE, CURRENT_DATE, 3, 4, 122),

-- ============================================================================
-- II. TRÁCH NHIỆM CHẤP HÀNH PHÁP LUẬT VÀ NỘI QUY, QUY CHẾ CỦA NHÀ TRƯỜNG (Tối đa 25 điểm)
-- ============================================================================
(2, 'II. Trách nhiệm chấp hành pháp luật và nội quy, quy chế của nhà trường', 'Mã tiêu chí: II', 25, TRUE, CURRENT_DATE, 0, 2, NULL),

  -- II.a
  (20, 'a. Trách nhiệm chấp hành các quy định của pháp luật đối với công dân, các văn bản chỉ đạo của cơ quan quản lý', 'Mã tiêu chí: II.a', 15, TRUE, CURRENT_DATE, 1, 1, 2),
    (201, 'Không vi phạm và có ý thức tham gia thực hiện nghiêm túc các quy định của Lớp, nội quy, quy chế của trường, Khoa và các tổ chức trong nhà trường', 'Mỗi lần vi phạm trừ điểm theo quy định', 15, TRUE, CURRENT_DATE, 2, 1, 20),

  -- II.b
  (21, 'b. Trách nhiệm chấp hành các nội quy, quy chế và các quy định khác của nhà trường', 'Mã tiêu chí: II.b', 10, TRUE, CURRENT_DATE, 1, 2, 2),
    -- II.b.1
    (211, 'Tích cực tham gia các hoạt động tuyên truyền, vận động mọi người xung quanh thực hiện nghiêm túc nội quy, quy chế của nhà trường', 'Mã tiêu chí: II.b.1', 8, TRUE, CURRENT_DATE, 2, 1, 21),
      (2111, 'Giữ gìn an ninh, trật tự nơi công cộng; vệ sinh, bảo vệ cảnh quan môi trường, nếp sống văn minh có xác nhận của Đoàn cơ sở', NULL, 8, TRUE, CURRENT_DATE, 3, 1, 211),
      (2112, 'Giữ gìn an ninh, trật tự nơi công cộng; vệ sinh, bảo vệ cảnh quan môi trường, nếp sống văn minh có xác nhận của Đoàn ĐHCT, Hội Sinh viên', NULL, 8, TRUE, CURRENT_DATE, 3, 2, 211),
      (2113, 'Tham gia khảo sát ý kiến do ĐHCT tổ chức', 'Mỗi lần tham gia được 1 điểm', 5, TRUE, CURRENT_DATE, 3, 3, 211),

-- ============================================================================
-- III. TRÁCH NHIỆM THAM GIA CÁC HOẠT ĐỘNG CHÍNH TRỊ - XÃ HỘI, VĂN HÓA, THỂ THAO... (Tối đa 20 điểm)
-- ============================================================================
(3, 'III. Trách nhiệm tham gia các hoạt động chính trị - xã hội, văn hóa, văn nghệ, thể thao, phòng chống tội phạm, tệ nạn xã hội', 'Mã tiêu chí: III', 20, TRUE, CURRENT_DATE, 0, 3, NULL),

  -- III.a
  (30, 'a. Trách nhiệm và hiệu quả tham gia các hoạt động rèn luyện về chính trị, xã hội, văn hóa, văn nghệ, thể thao', 'Mã tiêu chí: III.a. SV là người khuyết tật được đánh giá tùy theo thể trạng phù hợp', 12, TRUE, CURRENT_DATE, 1, 1, 3),
    (301, 'Tham gia đầy đủ các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao các cấp từ Lớp, Chi hội, Chi đoàn trở lên tổ chức', 'Mỗi lần vắng trừ 02 điểm từ cấp đơn vị lớp trở lên', 12, TRUE, CURRENT_DATE, 2, 1, 30),

  -- III.b
  (31, 'b. Trách nhiệm tham gia các hoạt động công ích, tình nguyện, công tác xã hội', 'Mã tiêu chí: III.b', 10, TRUE, CURRENT_DATE, 1, 2, 3),
    -- III.b.1
    (311, 'Là lực lượng nòng cốt trong các phong trào', 'Mã tiêu chí: III.b.1', 5, TRUE, CURRENT_DATE, 2, 1, 31),
      (3111, 'Cấp Bộ môn/Khoa, Chi đoàn, Chi hội', NULL, 3, TRUE, CURRENT_DATE, 3, 1, 311),
      (3112, 'Cấp ĐHCT; Đơn vị đào tạo và tương đương', NULL, 5, TRUE, CURRENT_DATE, 3, 2, 311),

    -- III.b.2
    (312, 'Được khen thưởng trong các hoạt động phong trào', 'Mã tiêu chí: III.b.2', 10, TRUE, CURRENT_DATE, 2, 2, 31),
      (3121, 'Giấy khen cấp cơ sở (và tương đương)', NULL, 6, TRUE, CURRENT_DATE, 3, 1, 312),
      (3122, 'Giấy khen cấp đại học (và tương đương)', NULL, 8, TRUE, CURRENT_DATE, 3, 2, 312),
      (3123, 'Giấy khen cấp cao hơn', NULL, 10, TRUE, CURRENT_DATE, 3, 3, 312),

  -- III.c
  (32, 'c. Tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội', 'Mã tiêu chí: III.c', 6, TRUE, CURRENT_DATE, 1, 3, 3),
    (321, 'Tham gia hoạt động tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội', 'Mỗi lần tham gia được 3 điểm', 6, TRUE, CURRENT_DATE, 2, 1, 32),

-- ============================================================================
-- IV. TRÁCH NHIỆM CÔNG DÂN TRONG QUAN HỆ CỘNG ĐỒNG (Tối đa 15 điểm)
-- ============================================================================
(4, 'IV. Trách nhiệm công dân trong quan hệ cộng đồng', 'Mã tiêu chí: IV', 15, TRUE, CURRENT_DATE, 0, 4, NULL),

  -- IV.a
  (40, 'a. Tham gia tuyên truyền các chủ trương của Đảng, chính sách, pháp luật của Nhà nước trong cộng đồng', 'Mã tiêu chí: IV.a', 8, TRUE, CURRENT_DATE, 1, 1, 4),
    (401, 'Tích cực tham gia tuyên truyền chủ trương của Đảng, chính sách, pháp luật Nhà nước trong cộng đồng. Không vi phạm pháp luật', 'Nếu vi phạm pháp luật sẽ bị điểm 0', 8, TRUE, CURRENT_DATE, 2, 1, 40),

  -- IV.b
  (41, 'b. Trách nhiệm tham gia các hoạt động xã hội được ghi nhận, biểu dương, khen thưởng', 'Mã tiêu chí: IV.b', 10, TRUE, CURRENT_DATE, 1, 2, 4),
    (411, 'Tham gia đội, nhóm sinh hoạt hướng đến lợi ích cộng đồng', 'Tham gia công tác xã hội do các đơn vị trong ĐHCT tổ chức/ phối hợp tổ chức (Mỗi đợt cộng tối đa 05 điểm)', 10, TRUE, CURRENT_DATE, 2, 1, 41),
    (412, 'Có tinh thần giúp đỡ bạn bè trong học tập, trong cuộc sống', NULL, 2, TRUE, CURRENT_DATE, 2, 2, 41),

-- ============================================================================
-- V. TRÁCH NHIỆM VÀ KẾT QUẢ THAM GIA CÔNG TÁC CÁN BỘ LỚP, ĐOÀN THỂ HOẶC THÀNH TÍCH XUẤT SẮC (Tối đa 20 điểm)
-- ============================================================================
(5, 'V. Trách nhiệm và kết quả tham gia công tác cán bộ lớp, đoàn thể hoặc có thành tích xuất sắc', 'Mã tiêu chí: V', 20, TRUE, CURRENT_DATE, 0, 5, NULL),

  -- V.a
  (50, 'a. Trách nhiệm, tinh thần, uy tín và hiệu quả công việc của SV được phân công nhiệm vụ quản lý', 'Mã tiêu chí: V.a', 10, TRUE, CURRENT_DATE, 1, 1, 5),
    (501, 'BCH Hội Sinh viên ĐHCT, BCH Đoàn cơ sở trở lên, Liên chi hội trưởng, Đội trưởng/Chủ nhiệm CLB/Đội/Nhóm, Bí thư Chi đoàn, Chi hội trưởng, Lớp trưởng', NULL, 10, TRUE, CURRENT_DATE, 2, 1, 50),
    (502, 'BCH Liên chi hội SV, BCH Chi đoàn, BCH Chi hội SV, BCN CLB/Đội/Nhóm, Lớp phó, HĐTQ KTX, Đội SV an ninh KTX, Nhà trưởng KTX, HĐTQ ngoại trú', 'Hoàn thành nhiệm vụ được giao', 8, TRUE, CURRENT_DATE, 2, 2, 50),
    (503, 'Là thành viên của các Ban chuyên môn Đoàn các cấp hoặc Hội sinh viên Việt Nam ĐHCT: Hoàn thành nhiệm vụ', 'Có xác nhận của Đoàn hoặc Hội tương ứng', 6, TRUE, CURRENT_DATE, 2, 3, 50),
    (504, 'Là thành viên hoàn thành nhiệm vụ được giao: Tổ trưởng, tổ phó của lớp chuyên ngành', NULL, 3, TRUE, CURRENT_DATE, 2, 4, 50),

  -- V.b
  (51, 'b. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và nhà trường', 'Mã tiêu chí: V.b', 12, TRUE, CURRENT_DATE, 1, 2, 5),
    (511, 'Tích cực tham gia, hỗ trợ các hoạt động phong trào, sự kiện chung của nhà trường có xác nhận của đơn vị tổ chức sự kiện', 'Mỗi đợt tham gia được cộng 03 điểm', 12, TRUE, CURRENT_DATE, 2, 1, 51),

  -- V.c
  (52, 'c. Có thành tích trong NCKH, tham gia các cuộc thi, sáng kiến cải tiến kỹ thuật, khởi nghiệp...', 'Mã tiêu chí: V.c', 8, TRUE, CURRENT_DATE, 1, 3, 5),
    (521, 'Được kết nạp Đảng', NULL, 6, TRUE, CURRENT_DATE, 2, 1, 52),
    (522, 'Được công nhận Đoàn viên ưu tú', NULL, 6, TRUE, CURRENT_DATE, 2, 2, 52),
    (523, 'Đạt danh hiệu SV 5 tốt cấp ĐHCT trở lên', NULL, 6, TRUE, CURRENT_DATE, 2, 3, 52),
    (524, 'Đạt danh hiệu SV 5 tốt cấp cơ sở', NULL, 4, TRUE, CURRENT_DATE, 2, 4, 52),
    (525, 'Phân loại Đảng viên được xếp loại mức 1', NULL, 8, TRUE, CURRENT_DATE, 2, 5, 52),
    (526, 'Phân loại Đảng viên được xếp loại mức 2', NULL, 5, TRUE, CURRENT_DATE, 2, 6, 52),
    (527, 'Có Giấy khen về NCKH', NULL, 6, TRUE, CURRENT_DATE, 2, 7, 52),
    (528, 'Đạt giải thưởng (Nhất, Nhì, Ba) trong các cuộc thi Khởi nghiệp', NULL, 6, TRUE, CURRENT_DATE, 2, 8, 52),
    (529, 'Đạt giải thưởng (Nhất, Nhì, Ba) trong các cuộc thi Olympic, học thuật cấp trên ĐHCT, và tương đương', NULL, 6, TRUE, CURRENT_DATE, 2, 9, 52);

-- Reset lại Sequence của Identity để các bản ghi tạo qua app sau này không bị lỗi trùng ID
ALTER TABLE point_categories ALTER COLUMN id RESTART WITH 1000;
