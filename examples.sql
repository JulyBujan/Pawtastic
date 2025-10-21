-- ONGs
INSERT INTO `ONGs` (`nombre`, `razon_social`, `cuit`, `direccion`) VALUES 
('Patitas Felices', 'Patitas Felices S.A.', '30-12345678-1', 'Avenida Siempreviva 742'),
('Amigos de 4 Patas', 'Amigos de 4 Patas SRL', '30-87654321-2', 'Calle Falsa 123'),
('Rescate Animal', 'Fundación Rescate Animal', '30-11223344-3', 'Elm Street 1428');

-- Mascotas
INSERT INTO `mascotas` (`id_ong`, `ong_email`, `nombre`, `tipo`, `edad`, `sexo`, `tamaño`, `vacunado`, `esterilizado`, `chip`, `descripcion`, `energia`, `sociabilidad`, `presencia`, `estilo`) VALUES
(1, 'contacto@patitasfelices.org', 'Snoopy', 'Perro', '5 años', 'Macho', 'Mediano', 'Sí', 'Sí', 'No', 'Beagle famoso por ser el perro de Charlie Brown.', 'Medio', 'Muy sociable', 'Independiente', 'Flexible'),
(1, 'contacto@patitasfelices.org', 'Scooby-Doo', 'Perro', '7 años', 'Macho', 'Grande', 'Sí', 'No', 'No', 'Gran Danés miedoso y glotón, resuelve misterios con sus amigos.', 'Bajo', 'Muy sociable', 'Necesita compañía constante', 'Indoor'),
(1, 'contacto@patitasfelices.org', 'Pluto', 'Perro', '8 años', 'Macho', 'Mediano', 'Sí', 'Sí', 'No', 'El leal perro de Mickey Mouse, es juguetón y curioso.', 'Alto', 'Muy sociable', 'Tolera estar solo', 'Flexible'),
(2, 'info@amigos4patas.com', 'Beethoven', 'Perro', '4 años', 'Macho', 'Grande', 'Sí', 'No', 'Sí', 'Un San Bernardo gigante y travieso pero de buen corazón.', 'Medio', 'Selectivo', 'Necesita compañía constante', 'Flexible'),
(2, 'info@amigos4patas.com', 'Toto', 'Perro', '3 años', 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'Pequeño Cairn terrier que acompañó a Dorothy en la tierra de Oz.', 'Alto', 'Reservado', 'Tolera estar solo', 'Indoor'),
(2, 'info@amigos4patas.com', 'Balto', 'Perro', '6 años', 'Macho', 'Grande', 'Sí', 'Sí', 'Sí', 'Valiente perro de trineo que lideró una expedición para salvar a su pueblo en Alaska.', 'Alto', 'Muy sociable', 'Independiente', 'Outdoor'),
(3, 'ayuda@rescateanimal.org', 'Lassie', 'Perro', '5 años', 'Hembra', 'Grande', 'Sí', 'Sí', 'No', 'Una Collie hermosa e inteligente, famosa por rescatar gente.', 'Medio', 'Muy sociable', 'Tolera estar solo', 'Flexible'),
(3, 'ayuda@rescateanimal.org', 'Marley', 'Perro', '2 años', 'Macho', 'Grande', 'Sí', 'No', 'Sí', 'Un Labrador retriever adorable pero muy destructivo, protagonista de "Marley y yo".', 'Alto', 'Muy sociable', 'Necesita compañía constante', 'Outdoor'),
(3, 'ayuda@rescateanimal.org', 'Milú', 'Perro', '4 años', 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'El inseparable Fox terrier blanco de Tintín, aventurero y leal.', 'Medio', 'Selectivo', 'Independiente', 'Flexible'),
(1, 'contacto@patitasfelices.org', 'Golfo', 'Perro', '6 años', 'Macho', 'Mediano', 'No', 'No', 'No', 'Perro callejero, encantador y astuto de "La Dama y el Vagabundo".', 'Medio', 'Muy sociable', 'Independiente', 'Outdoor'),
(2, 'info@amigos4patas.com', 'Benji', 'Perro', '5 años', 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'Un perro mestizo muy inteligente y heroico que siempre está en el lugar correcto para ayudar.', 'Medio', 'Selectivo', 'Independiente', 'Flexible');
