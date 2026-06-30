function OnElement_Catalogue(theElement) {
    var result = "";
    if (theElement.Stereotype == "OperationalArchitecture" ||
        theElement.Stereotype == "OperationalRole") {

        // Heuristik: Elemente sollten aus dem Modellelementekatalog-Package stammen
        // (Originalelement, kein "loses" Duplikat im Diagramm-Package).
        var pkg = Repository.GetPackageByID(theElement.PackageID);
        if (pkg.Name.indexOf("Modellelementekatalog") == -1 &&
            !IsReferencedElsewhere(theElement)) {
            result += "L3-MK03/04 Hinweis: '" + theElement.Name +
                "' liegt nicht im Modellelementekatalog und wird nirgends sonst referenziert " +
                "- prüfen, ob Neuanlage statt Wiederverwendung erfolgte.\n";
        }
    }
    return result;
}

function IsReferencedElsewhere(el) {
    // Prüft, ob das Element in mehr als einem Diagramm verwendet wird (Indiz für Katalog-Nutzung)
    var query = "SELECT COUNT(*) AS cnt FROM t_diagramobjects WHERE Object_ID = " + el.ElementID;
    var result = Repository.SQLQuery(query);
    // Parsing des XML-Ergebnisses vereinfacht dargestellt
    return result.indexOf("cnt>1<") > -1 || result.indexOf("cnt>2<") > -1;
}