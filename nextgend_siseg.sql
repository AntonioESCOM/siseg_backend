-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 09-10-2025 a las 17:17:56
-- Versión del servidor: 5.7.23-23
-- Versión de PHP: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `nextgend_siseg`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ALUMNO`
--

CREATE TABLE `ALUMNO` (
  `BOLETA` varchar(12) COLLATE utf8_unicode_ci NOT NULL,
  `CARRERA` int(11) DEFAULT NULL,
  `ESTATUS` int(11) DEFAULT NULL,
  `GENERACION` varchar(8) COLLATE utf8_unicode_ci DEFAULT NULL,
  `SEDE` int(11) DEFAULT NULL,
  `PROMEDIO` decimal(4,2) DEFAULT NULL,
  `RFC` varchar(13) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `ALUMNO`
--

INSERT INTO `ALUMNO` (`BOLETA`, `CARRERA`, `ESTATUS`, `GENERACION`, `SEDE`, `PROMEDIO`, `RFC`) VALUES
('2022630330', 1, 0, '2026', NULL, 9.50, 'MEAA'),
('2022630604', 1, 1, '2025', 11, 9.50, 'MOMA0306147C2');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `BITACORA`
--

CREATE TABLE `BITACORA` (
  `ID` int(11) NOT NULL,
  `ACCION` varchar(40) COLLATE utf8_unicode_ci DEFAULT NULL,
  `BOLETA` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `FECHA_EJECUCION` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CARRERA`
--

CREATE TABLE `CARRERA` (
  `ID` int(11) NOT NULL,
  `NOMBRE` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `CARRERA`
--

INSERT INTO `CARRERA` (`ID`, `NOMBRE`) VALUES
(1, 'Homeópata'),
(2, 'Partero');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CODIGO_QR`
--

CREATE TABLE `CODIGO_QR` (
  `ID` int(11) NOT NULL,
  `ADMIN_ENCARGADO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ALUMNO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `FECHA_LECTURA` datetime DEFAULT NULL,
  `QR` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `DIRECCION`
--

CREATE TABLE `DIRECCION` (
  `ALUMNO` varchar(12) COLLATE utf8_unicode_ci NOT NULL,
  `CALLE` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `COLONIA` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `CP` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `DELEGACION_MUNICIPIO` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ESTADO` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `DIRECCION`
--

INSERT INTO `DIRECCION` (`ALUMNO`, `CALLE`, `COLONIA`, `CP`, `DELEGACION_MUNICIPIO`, `ESTADO`) VALUES
('2022630604', 'jumil 368', 'Pedregal de Santo Domingo', '04369', 'Coyoacán', 'CDMXPP');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ENCUESTA`
--

CREATE TABLE `ENCUESTA` (
  `ID` int(11) NOT NULL,
  `ADMIN_ENCARGADO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ALUMNO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `FECHA_REGISTRO` datetime DEFAULT NULL,
  `PREGUNTA` int(11) DEFAULT NULL,
  `RESPUESTA` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ESTATUS_ALUMNO`
--

CREATE TABLE `ESTATUS_ALUMNO` (
  `ID` int(11) NOT NULL,
  `DESCRIPCION` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `ESTATUS_ALUMNO`
--

INSERT INTO `ESTATUS_ALUMNO` (`ID`, `DESCRIPCION`) VALUES
(0, 'INACTIVO'),
(1, 'ACTIVO'),
(2, 'SUSPENDIDO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ESTATUS_P_ADMIN`
--

CREATE TABLE `ESTATUS_P_ADMIN` (
  `ID` int(11) NOT NULL,
  `DESCRIPCION` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `ESTATUS_P_ADMIN`
--

INSERT INTO `ESTATUS_P_ADMIN` (`ID`, `DESCRIPCION`) VALUES
(0, 'INACTIVO'),
(1, 'ACTIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `EXPEDIENTE`
--

CREATE TABLE `EXPEDIENTE` (
  `ID` int(11) NOT NULL,
  `ALUMNO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ADMIN_ENCARGADO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ESTATUS` int(11) DEFAULT NULL,
  `FECHA_REGISTRO` datetime DEFAULT NULL,
  `NOMBRE_ARCHIVO` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `OBSERVACION` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `RUTA_ARCHIVO` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `EXPEDIENTE`
--

INSERT INTO `EXPEDIENTE` (`ID`, `ALUMNO`, `ADMIN_ENCARGADO`, `ESTATUS`, `FECHA_REGISTRO`, `NOMBRE_ARCHIVO`, `OBSERVACION`, `RUTA_ARCHIVO`) VALUES
(1, '2022630604', '2022630603', 2, '2025-10-05 02:30:16', 'Preregistro SIASS', 'Sin observaciones.', 'https://sisegplataform.online/uploads/2022630604/Preregistro SIASS.txt'),
(2, '2022630604', '2022630603', 4, '2025-10-05 02:30:16', 'Preregistro SIRSS', 'Archivo no legible.', 'https://sisegplataform.online/uploads/2022630604/Constan.txt'),
(8, '2022630604', NULL, 2, '2025-10-06 02:30:16', 'Preregistro SISS', 'Sin observaciones.', 'https://sisegplataform.online/uploads/2022630604/Preregistro SISS.txt'),
(11, '2022630604', NULL, 2, '2025-10-09 22:36:31', 'Constancia de derechos del IMS', 'Sin observaciones.', 'https://sisegplataform.online/uploads/2022630604/Constancia de derechos del IMSS.pdf');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PERSONA`
--

CREATE TABLE `PERSONA` (
  `BOLETA` varchar(12) COLLATE utf8_unicode_ci NOT NULL,
  `CORREO` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `CURP` varchar(18) COLLATE utf8_unicode_ci DEFAULT NULL,
  `CONTRASENA` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `NOMBRE` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `APELLIDO_PATERNO` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `APELLIDO_MATERNO` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ROL` enum('ALUMNO','P_ADMIN') COLLATE utf8_unicode_ci NOT NULL,
  `SEXO` char(1) COLLATE utf8_unicode_ci DEFAULT NULL,
  `TELEFONO_MOVIL` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `TELEFONO_FIJO` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `PERSONA`
--

INSERT INTO `PERSONA` (`BOLETA`, `CORREO`, `CURP`, `CONTRASENA`, `NOMBRE`, `APELLIDO_PATERNO`, `APELLIDO_MATERNO`, `ROL`, `SEXO`, `TELEFONO_MOVIL`, `TELEFONO_FIJO`) VALUES
('2022630330', 'amedinaa1702@alumno.ipn.mx', 'MEAA020423MMCDNNA1', '123', 'Ana Cristina', 'Medina', 'Angeles', 'ALUMNO', NULL, '', NULL),
('2022630603', 'morales.martinez.jose.antonio0@gmail.com', 'eyJhbGciOiJIUzI1Ni', '123', 'Administrador Antonio', 'Morales', 'Martinez', 'P_ADMIN', 'M', '5587414029', '5587424029'),
('2022630604', 'jmoralesm1802@alumno.ipn.mx', 'MOMA030614HDFRRNA8', '123', 'Jose Antonio', 'Morales', 'Martinez', 'ALUMNO', 'M', '5587414029', '5556196183');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PLAZA`
--

CREATE TABLE `PLAZA` (
  `ID` int(11) NOT NULL,
  `SEDE` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `CARRERA` int(11) DEFAULT NULL,
  `ESTATUS` int(11) DEFAULT NULL,
  `PROMOCION` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `PROGRAMA` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `TARJETA_DISPONIBLE` int(11) DEFAULT NULL,
  `TIPO_BECA` varchar(3) COLLATE utf8_unicode_ci DEFAULT NULL,
  `UBICACION` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `PLAZA`
--

INSERT INTO `PLAZA` (`ID`, `SEDE`, `CARRERA`, `ESTATUS`, `PROMOCION`, `PROGRAMA`, `TARJETA_DISPONIBLE`, `TIPO_BECA`, `UBICACION`) VALUES
(1, 'DFIMS000266 UMF 3 LA JOYA GUSTAVO A. MADERO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 1, 'A', 'Ote 91, La Joya, Gustavo A. Madero, 07890 Ciudad de México, CDMX'),
(2, 'DFIMS000085 UMF 11 PERALVILLO AZCAPOTZALCO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 2, 'A', 'S/N, Caruso esq, Vallejo, Gustavo A. Madero, 07870 Ciudad de México, CDMX'),
(3, 'DFIMS000650 UMF 16 COL. GUERRERO CUAUHTÉMOC', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 3, 'A', 'Francisco, González Bocanegra 10, Guerrero, Cuauhtémoc, 06300 Ciudad de México, CDMX'),
(4, 'DFIMS000254 UMF 23 U. MORELOS GUSTAVO A. MADERO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 4, 'A', 'DFIMS000254 UMF 23 U. MORELOS GUSTAVO A. MADERO'),
(5, 'DFIMS000341 UMF 35 C.7 ZARAGOZA IZTACALCO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 5, 'A', 'C. 7 200, Agrícola Pantitlán, 08100 Ciudad de México, CDMX'),
(6, 'DFIMS000271 UMF 41 FORTUNA GUSTAVO A. MADERO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 6, 'A', 'Av Fortuna 344, Magdalena de las Salinas, Gustavo A. Madero, 07760 Ciudad de México, CDMX'),
(7, 'DFIMS000295 UMF 94  S JUAN DE ARAGÓN', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 7, 'A', 'Calle Camino Antiguo a, Cam. San Juan de Aragón 235, San Juan de Aragón, Gustavo A. Madero, 07950 Ciudad de México, CDMX'),
(8, 'DFIMS000230 HGZMF 29 S. JUAN ARAGÓN GUSTAVO A. MADERO', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 8, 'A', 'Av. 510 100, Pueblo de San Juan de Aragón, Gustavo A. Madero, 07950 Ciudad de México, CDMX'),
(9, 'DFIMS000230 HGZMF 29 S. JUAN ARAGÓN GUSTAVO A. MADERO (DONACIÓN DE ORGANOS)', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 9, 'A', 'Av. 510 100, Pueblo de San Juan de Aragón, Gustavo A. Madero, 07950 Ciudad de México, CDMX'),
(10, 'DFIMS000213 HT MAGDALENA DE LAS SALINAS GUSTAVO A. MADERO (DONACIÓN DE ORGANOS)', 1, 1, '2026-1', 'IMSS NORTE, CDMX', 10, 'A', 'Av Fortuna 101, Magdalena de las Salinas, Gustavo A. Madero, 07760 Ciudad de México, CDMX'),
(11, 'DFIMS000580 HES CMN SIGLO XXI UNIDAD DE INVESTIGACIÓN MÉDICA EN INMUNOQUIMICA, UMAE', 1, 1, '2026-1', 'IMSS SUR, CDMX', 21, 'A', 'Av. Cuauhtémoc 330, Doctores, Cuauhtémoc, 06720 Ciudad de México, CDMX'),
(12, 'DFIMS000580 HES CMN SIGLO XXI UNIDAD DE INVESTIGACIÓN MÉDICA EN INMUNOQUIMICA, UMAE', 1, 1, '2026-1', 'IMSS SUR, CDMX', 22, 'A', 'Av. Cuauhtémoc 330, Doctores, Cuauhtémoc, 06720 Ciudad de México, CDMX'),
(13, 'DFIMS000580 HES CMN SIGLO XXI UNIDAD DE INVESTIGACIÓN MÉDICA EN NEFRÓLOGIA UMAE', 1, 1, '2026-1', 'IMSS SUR, CDMX', 23, 'A', 'Av. Cuauhtémoc 330, Doctores, Cuauhtémoc, 06720 Ciudad de México, CDMX'),
(14, 'DFIMS000580 HES CMN SIGLO XXI UNIDAD DE INVESTIGACIÓN MÉDICA EN BIOQUIMICA UMAE', 1, 1, '2026-1', 'IMSS SUR, CDMX', 24, 'A', 'Av. Cuauhtémoc 330, Doctores, Cuauhtémoc, 06720 Ciudad de México, CDMX'),
(15, 'DFIMS000580 HES CMN SIGLO XXI UNIDAD DE INVESTIGACIÓN MÉDICA EN ENFERMEDADES NEUROLÓGICAS UMAE', 1, 1, '2026-1', 'IMSS SUR, CDMX', 25, 'A', 'Av. Cuauhtémoc 330, Doctores, Cuauhtémoc, 06720 Ciudad de México, CDMX');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `P_ADMIN`
--

CREATE TABLE `P_ADMIN` (
  `BOLETA` varchar(12) COLLATE utf8_unicode_ci NOT NULL,
  `ESTATUS` int(11) DEFAULT NULL,
  `PERFIL` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `P_ADMIN`
--

INSERT INTO `P_ADMIN` (`BOLETA`, `ESTATUS`, `PERFIL`) VALUES
('2022630603', 0, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `REPORTE`
--

CREATE TABLE `REPORTE` (
  `ID` int(11) NOT NULL,
  `ADMIN_ENCARGADO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ALUMNO` varchar(12) COLLATE utf8_unicode_ci DEFAULT NULL,
  `DESCRIPCION` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `EVIDENCIA` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ESTATUS` int(11) DEFAULT NULL,
  `FECHA_REGISTRO` datetime DEFAULT NULL,
  `FECHA_MODIFICACION` datetime DEFAULT NULL,
  `FECHA_FINALIZADO` datetime DEFAULT NULL,
  `OBSERVACION` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `REPORTE`
--

INSERT INTO `REPORTE` (`ID`, `ADMIN_ENCARGADO`, `ALUMNO`, `DESCRIPCION`, `EVIDENCIA`, `ESTATUS`, `FECHA_REGISTRO`, `FECHA_MODIFICACION`, `FECHA_FINALIZADO`, `OBSERVACION`) VALUES
(1, NULL, '2022630604', 'Problema de pandemia', NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ALUMNO`
--
ALTER TABLE `ALUMNO`
  ADD PRIMARY KEY (`BOLETA`),
  ADD UNIQUE KEY `RFC` (`RFC`),
  ADD KEY `CARRERA` (`CARRERA`),
  ADD KEY `ALUMNO_ibfk_2` (`SEDE`),
  ADD KEY `ALUMNO_ibfk_4_idx` (`ESTATUS`);

--
-- Indices de la tabla `BITACORA`
--
ALTER TABLE `BITACORA`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `BOLETA` (`BOLETA`);

--
-- Indices de la tabla `CARRERA`
--
ALTER TABLE `CARRERA`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `CODIGO_QR`
--
ALTER TABLE `CODIGO_QR`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ALUMNO` (`ALUMNO`),
  ADD KEY `ADMIN_ENCARGADO` (`ADMIN_ENCARGADO`);

--
-- Indices de la tabla `DIRECCION`
--
ALTER TABLE `DIRECCION`
  ADD PRIMARY KEY (`ALUMNO`);

--
-- Indices de la tabla `ENCUESTA`
--
ALTER TABLE `ENCUESTA`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ALUMNO` (`ALUMNO`),
  ADD KEY `ADMIN_ENCARGADO` (`ADMIN_ENCARGADO`);

--
-- Indices de la tabla `ESTATUS_ALUMNO`
--
ALTER TABLE `ESTATUS_ALUMNO`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `ESTATUS_P_ADMIN`
--
ALTER TABLE `ESTATUS_P_ADMIN`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `EXPEDIENTE`
--
ALTER TABLE `EXPEDIENTE`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ALUMNO` (`ALUMNO`),
  ADD KEY `ADMIN_ENCARGADO` (`ADMIN_ENCARGADO`);

--
-- Indices de la tabla `PERSONA`
--
ALTER TABLE `PERSONA`
  ADD PRIMARY KEY (`BOLETA`),
  ADD UNIQUE KEY `CORREO` (`CORREO`),
  ADD UNIQUE KEY `CURP` (`CURP`);

--
-- Indices de la tabla `PLAZA`
--
ALTER TABLE `PLAZA`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `CARRERA` (`CARRERA`);

--
-- Indices de la tabla `P_ADMIN`
--
ALTER TABLE `P_ADMIN`
  ADD PRIMARY KEY (`BOLETA`),
  ADD KEY `P_ADMIN_ibfk_2_idx` (`ESTATUS`);

--
-- Indices de la tabla `REPORTE`
--
ALTER TABLE `REPORTE`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ALUMNO` (`ALUMNO`),
  ADD KEY `ADMIN_ENCARGADO` (`ADMIN_ENCARGADO`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `BITACORA`
--
ALTER TABLE `BITACORA`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `CARRERA`
--
ALTER TABLE `CARRERA`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `CODIGO_QR`
--
ALTER TABLE `CODIGO_QR`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ENCUESTA`
--
ALTER TABLE `ENCUESTA`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `EXPEDIENTE`
--
ALTER TABLE `EXPEDIENTE`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `PLAZA`
--
ALTER TABLE `PLAZA`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `REPORTE`
--
ALTER TABLE `REPORTE`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ALUMNO`
--
ALTER TABLE `ALUMNO`
  ADD CONSTRAINT `ALUMNO_ibfk_1` FOREIGN KEY (`BOLETA`) REFERENCES `PERSONA` (`BOLETA`),
  ADD CONSTRAINT `ALUMNO_ibfk_2` FOREIGN KEY (`SEDE`) REFERENCES `PLAZA` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `ALUMNO_ibfk_3` FOREIGN KEY (`CARRERA`) REFERENCES `CARRERA` (`ID`),
  ADD CONSTRAINT `ALUMNO_ibfk_4` FOREIGN KEY (`ESTATUS`) REFERENCES `ESTATUS_ALUMNO` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `BITACORA`
--
ALTER TABLE `BITACORA`
  ADD CONSTRAINT `BITACORA_ibfk_1` FOREIGN KEY (`BOLETA`) REFERENCES `PERSONA` (`BOLETA`);

--
-- Filtros para la tabla `CODIGO_QR`
--
ALTER TABLE `CODIGO_QR`
  ADD CONSTRAINT `CODIGO_QR_ibfk_1` FOREIGN KEY (`ALUMNO`) REFERENCES `ALUMNO` (`BOLETA`),
  ADD CONSTRAINT `CODIGO_QR_ibfk_2` FOREIGN KEY (`ADMIN_ENCARGADO`) REFERENCES `P_ADMIN` (`BOLETA`);

--
-- Filtros para la tabla `DIRECCION`
--
ALTER TABLE `DIRECCION`
  ADD CONSTRAINT `DIRECCION_ibfk_1` FOREIGN KEY (`ALUMNO`) REFERENCES `ALUMNO` (`BOLETA`);

--
-- Filtros para la tabla `ENCUESTA`
--
ALTER TABLE `ENCUESTA`
  ADD CONSTRAINT `ENCUESTA_ibfk_1` FOREIGN KEY (`ALUMNO`) REFERENCES `ALUMNO` (`BOLETA`),
  ADD CONSTRAINT `ENCUESTA_ibfk_2` FOREIGN KEY (`ADMIN_ENCARGADO`) REFERENCES `P_ADMIN` (`BOLETA`);

--
-- Filtros para la tabla `EXPEDIENTE`
--
ALTER TABLE `EXPEDIENTE`
  ADD CONSTRAINT `EXPEDIENTE_ibfk_1` FOREIGN KEY (`ALUMNO`) REFERENCES `ALUMNO` (`BOLETA`),
  ADD CONSTRAINT `EXPEDIENTE_ibfk_2` FOREIGN KEY (`ADMIN_ENCARGADO`) REFERENCES `P_ADMIN` (`BOLETA`);

--
-- Filtros para la tabla `PLAZA`
--
ALTER TABLE `PLAZA`
  ADD CONSTRAINT `CARRERA` FOREIGN KEY (`CARRERA`) REFERENCES `CARRERA` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `P_ADMIN`
--
ALTER TABLE `P_ADMIN`
  ADD CONSTRAINT `P_ADMIN_ibfk_1` FOREIGN KEY (`BOLETA`) REFERENCES `PERSONA` (`BOLETA`),
  ADD CONSTRAINT `P_ADMIN_ibfk_2` FOREIGN KEY (`ESTATUS`) REFERENCES `ESTATUS_P_ADMIN` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `REPORTE`
--
ALTER TABLE `REPORTE`
  ADD CONSTRAINT `REPORTE_ibfk_1` FOREIGN KEY (`ALUMNO`) REFERENCES `ALUMNO` (`BOLETA`),
  ADD CONSTRAINT `REPORTE_ibfk_2` FOREIGN KEY (`ADMIN_ENCARGADO`) REFERENCES `P_ADMIN` (`BOLETA`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
