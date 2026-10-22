using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecordRoom.Api.Infrastructure.Data;

#nullable disable

namespace RecordRoom.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261016121500_AddRecordKindAndDocumentSize")]
public partial class AddRecordKindAndDocumentSize : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "RecordKind",
            table: "Files",
            type: "nvarchar(8)",
            maxLength: 8,
            nullable: false,
            defaultValue: "File");

        migrationBuilder.AddColumn<string>(
            name: "DocumentSize",
            table: "Files",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: false,
            defaultValue: "Other");

        // Preserve the existing FileKind = Map classification when existing
        // records are upgraded; new records still use explicit kind/size rules.
        migrationBuilder.Sql("UPDATE [Files] SET [RecordKind] = N'Map' WHERE [FileKind] = 3;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "RecordKind", table: "Files");
        migrationBuilder.DropColumn(name: "DocumentSize", table: "Files");
    }
}
