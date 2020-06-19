const Text = [
	{
		title: "Introducción",
		text: [
			"SIIDit CHACO es una plataforma interactiva que provee de datos sobre los cambios de cobertura natural del Gran Chaco Americano e información territorial asociada de relevancia para consulta y análisis por parte de los usuarios.",
			"Para ello, utiliza tecnología de Inteligencia Artificial (IA) con algoritmos de machine learning y clasifica la cobertura del suelo a partir de imágenes satelitales Sentinel de 10m de resolución espacial."
		],
		defaultOpen: true,
	},
	{
		title: "Acerca del monitoreo",
		text: [
			"Guyra Paraguay monitorea desde el 2010, los cambios de uso del suelo en el Gran Chaco Americano, así como el estado de la cubierta aguas y eventos de incendios. Este monitoreo nació en respuesta a la necesidad de estudios acerca del estado de conservación y los impactos en la biodiversidad de las transformaciones de ecosistemas naturales",
			"Como resultado de estos años de trabajo, pudimos construir una serie de iniciativas de conservación y educación sobre la importancia de los recursos naturales con una visión ecorregional compartida entre Bolivia, Argentina, y Paraguay.",
			"Los resultados del monitoreo mensual se constituyeron como la base de estudios de especies determinadas tanto de fauna como de flora del GCA, teniendo en cuenta el impacto de la transformación de los ecosistemas naturales sobre su ecología, sus poblaciones y su distribución. Además, los datos del monitoreo han logrado incidir en las políticas públicas a nivel nacional y regional, siendo una herramienta clave para tomas de decisiones informadas sobre el territorio.",
			"Esta plataforma forma parte de una iniciativa de Guyra Paraguay y Ellipsis Earth Intelligence con el apoyo financiero de la UICN NL, con el fin de monitorear los cambios de uso de la cobertura forestal y vegetación natural del área del Gran Chaco Americano a través de una metodología de vanguardia utilizando principios técnicos de Inteligencia Artificial (IA) e imágenes satelitales Sentinel de alta resolución espacial, con información actualizada periódicamente de manera automática.",
			"Este proceso se constituye como el siguiente paso en los monitoreos de los cambios de uso del suelo en el Gran Chaco Americano, ampliando las posibilidades de mejorar el análisis logrando el reajuste temporal y de resolución espacial que la tecnología permite."
		],
		defaultOpen: false,
	},
	{
		title: "Metodología",
		text: [
			"Elaborado con tecnología de inteligencia artificial (algoritmo de machine learning) aplicada al análisis del paisaje; el monitoreo de coberturas del GCA es realizado con base en imágenes satelitales Sentinel de resolución espacial de 10m y periodicidad de clasificación quincenal.",
			"Las clases definidas para la clasificación son bosque y otras coberturas naturales, mientras que otros usos y coberturas son enmascarados. A partir de esto, el algoritmo fue entrenado para reconocer las clases de toda el área del GCA a partir de las imágenes satelitales mediante una clasificación supervisada. Esto dio como resultado capas de información de la cobertura del suelo de distintos periodos de tiempo, cuya superficie de transformación puede ser analizada en la plataforma y descargada por los usuarios.",
			"De manera a realizar análisis territoriales a nivel nacional y/o regional con la información generada, la plataforma proporciona además datos del territorio en distintos niveles de agregación. En este sentido, fueron incorporadas capas de información del GCA tales como Áreas Silvestres Protegidas, Áreas de Importancia para la Conservación de las Aves (IBAs), y Tierras Indígenas a nivel del Gran Chaco y, a nivel Paraguay, datos del Servicio Nacional de Catastro (SNC), Áreas con Certificados por Servicios Ambientales y Declaraciones de Impacto Ambiental (DIAs) del Ministerio del Ambiente y Desarrollo Sostenible (MADES)."
		],
		defaultOpen: false,
	},
	{
		title: "Base de datos",
		text: [
			"El monitoreo de cambios de uso del suelo en el área del Gran Chaco Americano (GCA) es una iniciativa realizada por Guyra Paraguay desde el año 2010. En un esfuerzo por lograr la automatización del proceso de monitoreo que originalmente fuera realizado mediante interpretación visual a partir de imágenes satelitales y vectorización manual de los cambios de cobertura forestal, unimos experiencias con el equipo de Ellipsis Earth Intelligence y, aplicando metodologías de Inteligencia Artificial (IA) desarrollamos esta plataforma de monitoreo de cambios en las coberturas naturales del GCA que permite a los usuarios interactuar con la información de acuerdo a sus necesidades.",
			"Los datos de monitoreo generados a lo largo de estos años han servido a instituciones de todos los sectores, y por sobre todo se ha constituido como una herramienta de información confiable y de calidad abierta y comprensible, generando incidencia en la ciudadanía y sirviendo a los tomadores de decisiones en el desempeño de sus funciones.",
			"A lo largo de los años en que Guyra Paraguay ha venido monitoreando los cambios de uso del suelo en el gran Chaco, fueron varias las organizaciones que hicieron posible la elaboración y difusión de los resultados del monitoreo, mediante su apoyo técnico y financiero. De manera a reconocer su importante aporte y agradecerles se menciona a alguna de ellas: World Land Trust WLT, Iniciativa Redes Chaco – AVINA, Alianza Ecosistemas, el Programa WCS-USAID “Ka’aguy Reta: Bosques y Desarrollo”, Comité Holandés de la UICN, el Banco de Desarrollo de América Latina CAF, World Resource Institute y la Global Forest Watch.",
			"La base de datos generada se encuentra aquí disponible para descarga y uso de la información.",
			{type: "link", url: 'http://guyra.org.py/informe-deforestacion'}
		],
		defaultOpen: false,
	},
	{
		title: "WMTS/WFS",
		text: [
			"Puede importar los datos en QGIS o ArcGIS utilizando estos enlaces.",
			"",
			"WMTS: https://api.ellipsis-earth.com/v2/wmts/6b696129-659a-4cf4-8dd6-2cf0642f58db",
			"WFS: https://api.ellipsis-earth.com/v2/wfs/6b696129-659a-4cf4-8dd6-2cf0642f58db"
		],
		defaultOpen: false,
	},
	{
		title: "Colofón",
		text: [
			"Co-autores: Guyra Paraguay - Ellipsis Earth Intelligence - IUCN NL",
			"Organizaciones asociadas: Consorcio PACHA: WWF Paraguay, IDEA (Instituto de Derecho y Economía Ambiental) y Guyra Paraguay"
		],
		defaultOpen: false,
	}
]

export default Text
