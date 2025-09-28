-- Insert demo users
-- Chạy script này sau khi đã chạy schema.sql thành công

-- Tạo admin user demo
INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    organization, 
    phone
) VALUES (
    gen_random_uuid(),
    'admin@soyte.gov.vn',
    'Quản trị viên Sở Y tế',
    'admin',
    'Sở Y tế Thành phố',
    '0123456789'
) ON CONFLICT (email) DO NOTHING;

-- Tạo user demo
INSERT INTO users (
    id,
    email,
    name, 
    role,
    organization,
    phone
) VALUES (
    gen_random_uuid(),
    'user@benhvien.gov.vn',
    'Bác sĩ Nguyễn Văn A',
    'user', 
    'Bệnh viện Đa khoa ABC',
    '0987654321'
) ON CONFLICT (email) DO NOTHING;

-- Tạo thêm một số user demo khác
INSERT INTO users (
    id,
    email,
    name,
    role,
    organization,
    phone
) VALUES (
    gen_random_uuid(),
    'bs.nguyen@bvdahoc.vn',
    'BS. Nguyễn Thị B',
    'user',
    'Bệnh viện Đại học Y',
    '0912345678'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (
    id,
    email,
    name,
    role,
    organization,
    phone  
) VALUES (
    gen_random_uuid(),
    'duocsi.tran@bvtrunguong.vn',
    'DS. Trần Văn C',
    'user',
    'Bệnh viện Trung ương',
    '0923456789'
) ON CONFLICT (email) DO NOTHING;


