-- ========================================
-- SCRIPT DE IMPORTACIÓN DE PROCEDIMIENTOS
-- ========================================
-- Este script inserta todos los procedimientos del CSV a la tabla de Supabase
-- Copia todo y ejecútalo en SQL Editor de Supabase

INSERT INTO public.procedures (year, month, month_key, code, description, quantity, date) VALUES
(2024, 'Enero', '01', '140', 'EXAMEN CLINICO PARCIAL', 3, '2024-01-01'),
(2024, 'Enero', '01', '150', 'EXAMEN CLINICO COMPLETO', 9, '2024-01-01'),
(2024, 'Enero', '01', '220', 'RX PERIAPICAL-1 PELICULA', 9, '2024-01-01'),
(2024, 'Enero', '01', '270', 'BITEWING UNILATERAL', 1, '2024-01-01'),
(2024, 'Enero', '01', '272', 'BITEWINGS-BILATERAL', 4, '2024-01-01'),
(2024, 'Enero', '01', '274', 'BITEWINGS-BILATERAL 4 PLACAS', 5, '2024-01-01'),
(2024, 'Enero', '01', '330', 'ORTOPANTOMOGRAFIA', 9, '2024-01-01'),
(2024, 'Enero', '01', '337', 'SCANNER 3D(CONE BEAM)', 2, '2024-01-01'),
(2024, 'Enero', '01', '470', 'IMPRESIONES / MODELOS DIAGNÓST.', 1, '2024-01-01'),
(2024, 'Enero', '01', '501', 'EXAMEN HISTOPATOLÓGICO', 1, '2024-01-01'),
(2024, 'Enero', '01', '1101', 'PROFILAXIS SUPERFICIAL TOTAL', 4, '2024-01-01'),
(2024, 'Enero', '01', '1110', 'PROFILAXIS-ADULTO 3 GRUPOS', 74, '2024-01-01'),
(2024, 'Enero', '01', '1120', 'PROFILAXIS-NIÑO', 7, '2024-01-01'),
(2024, 'Enero', '01', '1203', 'FLUORACIÓN SILANO NIÑO', 4, '2024-01-01'),
(2024, 'Enero', '01', '1204', 'FLUORACIÓN SILANO ADULTO', 12, '2024-01-01'),
(2024, 'Enero', '01', '1330', 'INSTRUCCIÓN DE HIGIENE ORAL', 2, '2024-01-01'),
(2024, 'Enero', '01', '1351', 'SELLANTE', 3, '2024-01-01'),
(2024, 'Enero', '01', '1355', 'SESIÓN DE TRATAMIENTO', 3, '2024-01-01'),
(2024, 'Enero', '01', '2139', 'BLANQUEAMIENTO', 1, '2024-01-01'),
(2024, 'Enero', '01', '2330', 'RESINA-UNA SUPERF. ANTERIOR', 10, '2024-01-01'),
(2024, 'Enero', '01', '2331', 'RESINA-DOS SUPERF. ANTERIOR', 2, '2024-01-01'),
(2024, 'Enero', '01', '2332', 'RESINA TRES SUPERFI ANTERIOR', 1, '2024-01-01'),
(2024, 'Enero', '01', '2385', 'RESINA-1 SUPERF POST-PERMANENTE', 23, '2024-01-01'),
(2024, 'Enero', '01', '2386', 'RESINA-2 SUPER POST PERMANENTE', 2, '2024-01-01'),
(2024, 'Enero', '01', '2610', 'INLAY-PORCEL/CERÁMICA-1 SUPERF.', 6, '2024-01-01'),
(2024, 'Enero', '01', '2620', 'INLAY-PORCEL/CERÁMICA-2 SUPERF.', 2, '2024-01-01'),
(2024, 'Enero', '01', '2630', 'INLAY-PORCEL/CERÁMICA-3+ SUPERF', 2, '2024-01-01'),
(2024, 'Enero', '01', '2710', 'CORONA DE RESINA PROVISORI', 1, '2024-01-01'),
(2024, 'Enero', '01', '2740', 'CORONA CERÁMICA', 3, '2024-01-01'),
(2024, 'Enero', '01', '2955', 'REMOCIÓN DE ESPIGA - CORONA', 1, '2024-01-01'),
(2024, 'Enero', '01', '2960', 'CARILLA VESTIBULAR RESINA', 1, '2024-01-01'),
(2024, 'Enero', '01', '3229', 'EXODONCIA PRIMARIO', 2, '2024-01-01'),
(2024, 'Enero', '01', '3320', 'ENDODONCIA PREMOLAR', 2, '2024-01-01'),
(2024, 'Enero', '01', '3330', 'ENDODONCIA MOLAR', 2, '2024-01-01'),
(2024, 'Enero', '01', '3999', 'SESIÓN ENDODONCIA', 2, '2024-01-01'),
(2024, 'Enero', '01', '4341', 'PROFILAXIS PROFUNDA POR GRUPO', 11, '2024-01-01'),
(2024, 'Enero', '01', '4930', 'REEVALUACIÓN', 1, '2024-01-01'),
(2024, 'Enero', '01', '4940', 'RETIRO DE SUTURA', 3, '2024-01-01'),
(2024, 'Enero', '01', '4941', 'CONTROL DE CIRUGIA', 2, '2024-01-01'),
(2024, 'Enero', '01', '6010', 'CIRUGIA DE IMPLANTES C/U', 3, '2024-01-01'),
(2024, 'Enero', '01', '6020', 'EXPOSICIÓN DEL IMPLANTE', 3, '2024-01-01'),
(2024, 'Enero', '01', '6025', 'CORONA IMPLANTO SOPORTADA', 1, '2024-01-01'),
(2024, 'Enero', '01', '6030', 'PILAR MULTI UNIT Y ADITAMENTOS', 1, '2024-01-01'),
(2024, 'Enero', '01', '6034', 'PILAR ESTETICO INDIVIDUALIZADO', 1, '2024-01-01'),
(2024, 'Enero', '01', '7004', 'LABORATORIO PROVISORIO', 1, '2024-01-01'),
(2024, 'Enero', '01', '7006', 'LABORATORIO PLANO', 1, '2024-01-01'),
(2024, 'Enero', '01', '7010', 'LABORATORIO INC CEREC', 9, '2024-01-01'),
(2024, 'Enero', '01', '7012', 'LABORATORIO CORONA IMPLANTOSOPO', 2, '2024-01-01'),
(2024, 'Enero', '01', '7013', 'LABORATORIO CORONA PORCELANA', 2, '2024-01-01')
ON CONFLICT (code, month_key, year) DO NOTHING;

-- Resultado esperado: ~50 filas insertadas
-- Si reciben errores de CONFLICT, significa que ya existen esos registros
